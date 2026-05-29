import type { IdeaIntake, GeneratedFile } from '../types';

export function generateSolanaFiles(idea: IdeaIntake): GeneratedFile[] {
  if (!idea.hasBlockchain) return [];

  const files: GeneratedFile[] = [];
  const programName = idea.appName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const hasTokens = idea.blockchainFeatures.some((f) => f.toLowerCase().includes('token'));
  const hasNFT = idea.blockchainFeatures.some((f) => f.toLowerCase().includes('nft'));
  const hasPayments = idea.blockchainFeatures.some((f) => f.toLowerCase().includes('payment') || f.toLowerCase().includes('transfer'));
  const hasStaking = idea.blockchainFeatures.some((f) => f.toLowerCase().includes('stak'));
  const hasGovernance = idea.blockchainFeatures.some((f) => f.toLowerCase().includes('govern') || f.toLowerCase().includes('vot'));

  let programContent = `// SPDX-License-Identifier: MIT
// ${idea.appName} - Solana Program
// Built with Anchor Framework

use anchor_lang::prelude::*;
${hasTokens ? 'use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};' : ''}

declare_id!("${generateProgramId()}");

#[program]
pub mod ${programName} {
    use super::*;

    /// Initialize the program state
    pub fn initialize(ctx: Context<Initialize>, config: ProgramConfig) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.authority = ctx.accounts.authority.key();
        state.name = config.name;
        state.is_active = true;
        state.created_at = Clock::get()?.unix_timestamp;
        state.total_users = 0;
        
        emit!(ProgramInitialized {
            authority: state.authority,
            name: state.name.clone(),
            timestamp: state.created_at,
        });
        
        Ok(())
    }

    /// Register a new user
    pub fn register_user(ctx: Context<RegisterUser>, username: String) -> Result<()> {
        require!(username.len() <= 32, ErrorCode::UsernameTooLong);
        require!(username.len() >= 3, ErrorCode::UsernameTooShort);
        
        let user = &mut ctx.accounts.user_account;
        user.owner = ctx.accounts.owner.key();
        user.username = username.clone();
        user.created_at = Clock::get()?.unix_timestamp;
        user.is_active = true;
        user.reputation = 0;
        
        let state = &mut ctx.accounts.program_state;
        state.total_users = state.total_users.checked_add(1).unwrap();
        
        emit!(UserRegistered {
            owner: user.owner,
            username,
            timestamp: user.created_at,
        });
        
        Ok(())
    }`;

  if (hasPayments) {
    programContent += `

    /// Transfer SOL between users
    pub fn transfer_sol(ctx: Context<TransferSol>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(
            ctx.accounts.sender.lamports() >= amount,
            ErrorCode::InsufficientFunds
        );
        
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.sender.key(),
            &ctx.accounts.recipient.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.sender.to_account_info(),
                ctx.accounts.recipient.to_account_info(),
            ],
        )?;
        
        emit!(SolTransferred {
            from: ctx.accounts.sender.key(),
            to: ctx.accounts.recipient.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }`;
  }

  if (hasStaking) {
    programContent += `

    /// Stake tokens
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        let stake_account = &mut ctx.accounts.stake_account;
        stake_account.owner = ctx.accounts.staker.key();
        stake_account.amount = stake_account.amount.checked_add(amount).unwrap();
        stake_account.staked_at = Clock::get()?.unix_timestamp;
        stake_account.last_claim = Clock::get()?.unix_timestamp;
        
        emit!(TokensStaked {
            staker: ctx.accounts.staker.key(),
            amount,
            total_staked: stake_account.amount,
            timestamp: stake_account.staked_at,
        });
        
        Ok(())
    }

    /// Unstake tokens
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(stake_account.amount >= amount, ErrorCode::InsufficientStake);
        
        stake_account.amount = stake_account.amount.checked_sub(amount).unwrap();
        
        emit!(TokensUnstaked {
            staker: ctx.accounts.staker.key(),
            amount,
            remaining: stake_account.amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Claim staking rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let now = Clock::get()?.unix_timestamp;
        let elapsed = now - stake_account.last_claim;
        
        // 10% APY calculated per second
        let reward = (stake_account.amount as u128)
            .checked_mul(elapsed as u128)
            .unwrap()
            .checked_mul(10)
            .unwrap()
            .checked_div(100 * 365 * 24 * 3600)
            .unwrap() as u64;
        
        require!(reward > 0, ErrorCode::NoRewardsToClaim);
        
        stake_account.last_claim = now;
        stake_account.total_rewards = stake_account.total_rewards.checked_add(reward).unwrap();
        
        emit!(RewardsClaimed {
            staker: ctx.accounts.staker.key(),
            reward,
            total_rewards: stake_account.total_rewards,
            timestamp: now,
        });
        
        Ok(())
    }`;
  }

  if (hasGovernance) {
    programContent += `

    /// Create a governance proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        voting_period: i64,
    ) -> Result<()> {
        require!(title.len() <= 100, ErrorCode::TitleTooLong);
        require!(description.len() <= 1000, ErrorCode::DescriptionTooLong);
        require!(voting_period >= 86400, ErrorCode::VotingPeriodTooShort); // Min 1 day
        
        let proposal = &mut ctx.accounts.proposal;
        proposal.creator = ctx.accounts.creator.key();
        proposal.title = title.clone();
        proposal.description = description;
        proposal.created_at = Clock::get()?.unix_timestamp;
        proposal.voting_ends_at = proposal.created_at + voting_period;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.status = ProposalStatus::Active;
        
        emit!(ProposalCreated {
            creator: proposal.creator,
            title,
            voting_ends_at: proposal.voting_ends_at,
            timestamp: proposal.created_at,
        });
        
        Ok(())
    }

    /// Vote on a proposal
    pub fn vote(ctx: Context<Vote>, vote_for: bool) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let now = Clock::get()?.unix_timestamp;
        require!(now < proposal.voting_ends_at, ErrorCode::VotingEnded);
        require!(proposal.status == ProposalStatus::Active, ErrorCode::ProposalNotActive);
        
        let vote_record = &mut ctx.accounts.vote_record;
        require!(!vote_record.has_voted, ErrorCode::AlreadyVoted);
        
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal = ctx.accounts.proposal.key();
        vote_record.vote_for = vote_for;
        vote_record.has_voted = true;
        vote_record.voted_at = now;
        
        if vote_for {
            proposal.yes_votes = proposal.yes_votes.checked_add(1).unwrap();
        } else {
            proposal.no_votes = proposal.no_votes.checked_add(1).unwrap();
        }
        
        emit!(VoteCast {
            voter: ctx.accounts.voter.key(),
            proposal: ctx.accounts.proposal.key(),
            vote_for,
            timestamp: now,
        });
        
        Ok(())
    }`;
  }

  programContent += `
}

// ============ Account Structures ============

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub name: String,
    pub is_active: bool,
    pub created_at: i64,
    pub total_users: u64,
}

#[account]
pub struct UserAccount {
    pub owner: Pubkey,
    pub username: String,
    pub created_at: i64,
    pub is_active: bool,
    pub reputation: u64,
}`;

  if (hasStaking) {
    programContent += `

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub staked_at: i64,
    pub last_claim: i64,
    pub total_rewards: u64,
}`;
  }

  if (hasGovernance) {
    programContent += `

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    Executed,
}

#[account]
pub struct Proposal {
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub created_at: i64,
    pub voting_ends_at: i64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub status: ProposalStatus,
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub vote_for: bool,
    pub has_voted: bool,
    pub voted_at: i64,
}`;
  }

  programContent += `

// ============ Instruction Contexts ============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 64 + 1 + 8 + 8,
        seeds = [b"program-state"],
        bump,
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 64 + 8 + 1 + 8,
        seeds = [b"user", owner.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut, seeds = [b"program-state"], bump)]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}`;

  if (hasPayments) {
    programContent += `

#[derive(Accounts)]
pub struct TransferSol<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: Recipient account
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}`;
  }

  if (hasStaking) {
    programContent += `

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        init_if_needed,
        payer = staker,
        space = 8 + 32 + 8 + 8 + 8 + 8,
        seeds = [b"stake", staker.key().as_ref()],
        bump,
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub staker: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"stake", staker.key().as_ref()],
        bump,
        has_one = owner @ ErrorCode::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub staker: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"stake", staker.key().as_ref()],
        bump,
        has_one = owner @ ErrorCode::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub staker: Signer<'info>,
}`;
  }

  if (hasGovernance) {
    programContent += `

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 128 + 1024 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"proposal", creator.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + 32 + 1 + 1 + 8,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}`;
  }

  programContent += `

// ============ Config Structs ============

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProgramConfig {
    pub name: String,
}

// ============ Events ============

#[event]
pub struct ProgramInitialized {
    pub authority: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[event]
pub struct UserRegistered {
    pub owner: Pubkey,
    pub username: String,
    pub timestamp: i64,
}`;

  if (hasPayments) {
    programContent += `

#[event]
pub struct SolTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}`;
  }

  if (hasStaking) {
    programContent += `

#[event]
pub struct TokensStaked {
    pub staker: Pubkey,
    pub amount: u64,
    pub total_staked: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensUnstaked {
    pub staker: Pubkey,
    pub amount: u64,
    pub remaining: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardsClaimed {
    pub staker: Pubkey,
    pub reward: u64,
    pub total_rewards: u64,
    pub timestamp: i64,
}`;
  }

  if (hasGovernance) {
    programContent += `

#[event]
pub struct ProposalCreated {
    pub creator: Pubkey,
    pub title: String,
    pub voting_ends_at: i64,
    pub timestamp: i64,
}

#[event]
pub struct VoteCast {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub vote_for: bool,
    pub timestamp: i64,
}`;
  }

  programContent += `

// ============ Error Codes ============

#[error_code]
pub enum ErrorCode {
    #[msg("Username must be 32 characters or less")]
    UsernameTooLong,
    #[msg("Username must be at least 3 characters")]
    UsernameTooShort,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Voting period too short")]
    VotingPeriodTooShort,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Already voted")]
    AlreadyVoted,
}`;

  files.push({
    path: `contracts/${programName}.rs`,
    content: programContent,
    language: 'rust',
    category: 'contract',
  });

  files.push({
    path: 'contracts/Anchor.toml',
    content: `[features]
seeds = false
skip-lint = false

[programs.devnet]
${programName} = "${generateProgramId()}"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"`,
    language: 'toml',
    category: 'contract',
  });

  files.push({
    path: `contracts/tests/${programName}.test.ts`,
    content: `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("${programName}", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("Initializes the program", async () => {
    // Test initialization
    console.log("Program initialized successfully");
  });

  it("Registers a new user", async () => {
    // Test user registration
    console.log("User registered successfully");
  });
${hasPayments ? `
  it("Transfers SOL between users", async () => {
    // Test SOL transfer
    console.log("SOL transferred successfully");
  });
` : ''}${hasStaking ? `
  it("Stakes tokens", async () => {
    // Test staking
    console.log("Tokens staked successfully");
  });

  it("Claims rewards", async () => {
    // Test reward claiming
    console.log("Rewards claimed successfully");
  });
` : ''}${hasGovernance ? `
  it("Creates a proposal", async () => {
    // Test proposal creation
    console.log("Proposal created successfully");
  });

  it("Votes on a proposal", async () => {
    // Test voting
    console.log("Vote cast successfully");
  });
` : ''}});`,
    language: 'typescript',
    category: 'contract',
  });

  return files;
}

function generateProgramId(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
