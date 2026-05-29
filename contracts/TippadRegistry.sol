// SPDX-License-Identifier: MIT
// FIX [MEDIUM] SWC-103: Locked pragma to exact version instead of floating ^0.8.20
pragma solidity 0.8.20;

/// @title Tippad Project Registry
/// @notice On-chain registry for tracking Tippad-generated projects and their deployments
/// @dev Implements project registration, deployment tracking, and access control
///      Security fixes applied: SWC-103, SWC-104, zero-address checks, storage optimizations,
///      input validation, missing events, and redundant read elimination.

/// @dev Interface for ERC20 token interactions (tip payments)
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract TippadRegistry {
    // ============ State Variables ============

    address private _owner;
    bool private _locked;
    bool private _paused;
    uint256 private _projectCounter;
    uint256 private _deploymentCounter;

    // ============ Constants ============

    /// @dev Maximum number of stack types allowed per project (prevents gas griefing)
    uint256 private constant MAX_STACK_TYPES = 10;

    /// @dev Maximum number of blockchain features per project
    uint256 private constant MAX_ARRAY_LENGTH = 50;

    // ============ Structs ============

    struct Project {
        uint256 id;
        address creator;
        string name;
        string description;
        string ideaHash;          // IPFS hash of the original idea intake
        string[] stackTypes;      // ["frontend", "backend", "contract"]
        uint256 fileCount;
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
        uint256 totalDeployments;
        uint256 tipBalance;
    }

    struct Deployment {
        uint256 id;
        uint256 projectId;
        address deployer;
        string deploymentType;    // "frontend", "backend", "contract"
        string provider;          // "vercel", "railway", "solana-devnet"
        string url;
        string commitHash;
        uint256 deployedAt;
        bool isActive;
    }

    struct UserProfile {
        address userAddress;
        string username;
        uint256 projectCount;
        uint256 deploymentCount;
        uint256 totalTipsReceived;
        uint256 registeredAt;
        bool isActive;
    }

    // ============ Mappings ============

    mapping(uint256 => Project) private _projects;
    mapping(uint256 => Deployment) private _deployments;
    mapping(address => UserProfile) private _users;
    mapping(address => uint256[]) private _userProjects;
    mapping(uint256 => uint256[]) private _projectDeployments;
    mapping(address => bool) private _registeredUsers;
    mapping(uint256 => mapping(address => bool)) private _projectCollaborators;

    // ============ Events ============

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    event UserRegistered(address indexed user, string username, uint256 timestamp);
    event ProjectCreated(uint256 indexed projectId, address indexed creator, string name, uint256 timestamp);
    event ProjectUpdated(uint256 indexed projectId, string name, uint256 timestamp);
    event ProjectDeactivated(uint256 indexed projectId, uint256 timestamp);
    event DeploymentCreated(uint256 indexed deploymentId, uint256 indexed projectId, string deploymentType, string provider, uint256 timestamp);
    event DeploymentDeactivated(uint256 indexed deploymentId, uint256 timestamp);
    event CollaboratorAdded(uint256 indexed projectId, address indexed collaborator, uint256 timestamp);
    event CollaboratorRemoved(uint256 indexed projectId, address indexed collaborator, uint256 timestamp);
    event TipSent(uint256 indexed projectId, address indexed tipper, uint256 amount, uint256 timestamp);
    event TipWithdrawn(uint256 indexed projectId, address indexed creator, uint256 amount, uint256 timestamp);
    // FIX [LOW] Missing Events: Added events for emergency withdrawal and user deactivation
    event EmergencyWithdrawal(address indexed owner, uint256 amount, uint256 timestamp);
    event UserDeactivated(address indexed user, uint256 timestamp);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == _owner, "TippadRegistry: caller is not the owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "TippadRegistry: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    modifier whenNotPaused() {
        require(!_paused, "TippadRegistry: paused");
        _;
    }

    modifier onlyRegistered() {
        require(_registeredUsers[msg.sender], "TippadRegistry: user not registered");
        _;
    }

    modifier onlyProjectOwner(uint256 projectId) {
        require(_projects[projectId].creator == msg.sender, "TippadRegistry: not project owner");
        _;
    }

    modifier onlyProjectAccess(uint256 projectId) {
        require(
            _projects[projectId].creator == msg.sender || _projectCollaborators[projectId][msg.sender],
            "TippadRegistry: no project access"
        );
        _;
    }

    modifier validProject(uint256 projectId) {
        require(projectId > 0 && projectId <= _projectCounter, "TippadRegistry: invalid project ID");
        require(_projects[projectId].isActive, "TippadRegistry: project not active");
        _;
    }

    // ============ Constructor ============

    // FIX [MEDIUM] Missing Zero Address Check: Added initialOwner parameter with validation
    /// @param initialOwner The address that will own this contract
    constructor(address initialOwner) {
        require(initialOwner != address(0), "TippadRegistry: owner is zero address");

        _owner = initialOwner;
        _locked = false;
        _paused = false;
        _projectCounter = 0;
        _deploymentCounter = 0;

        emit OwnershipTransferred(address(0), initialOwner);
    }

    // ============ User Management ============

    /// @notice Register a new user
    /// @param username The desired username (3-32 characters)
    function registerUser(string calldata username) external whenNotPaused {
        require(!_registeredUsers[msg.sender], "TippadRegistry: already registered");
        require(bytes(username).length >= 3, "TippadRegistry: username too short");
        require(bytes(username).length <= 32, "TippadRegistry: username too long");

        _users[msg.sender] = UserProfile({
            userAddress: msg.sender,
            username: username,
            projectCount: 0,
            deploymentCount: 0,
            totalTipsReceived: 0,
            registeredAt: block.timestamp,
            isActive: true
        });

        _registeredUsers[msg.sender] = true;

        emit UserRegistered(msg.sender, username, block.timestamp);
    }

    /// @notice Get user profile
    /// @param user The user address
    /// @return The user profile
    function getUser(address user) external view returns (UserProfile memory) {
        require(_registeredUsers[user], "TippadRegistry: user not found");
        return _users[user];
    }

    // ============ Project Management ============

    /// @notice Create a new project
    /// @param name Project name
    /// @param description Project description
    /// @param ideaHash IPFS hash of the idea intake data
    /// @param stackTypes Array of stack types used
    /// @param fileCount Number of generated files
    /// @return projectId The ID of the created project
    function createProject(
        string calldata name,
        string calldata description,
        string calldata ideaHash,
        string[] calldata stackTypes,
        uint256 fileCount
    ) external whenNotPaused onlyRegistered returns (uint256 projectId) {
        require(bytes(name).length > 0, "TippadRegistry: name required");
        require(bytes(name).length <= 100, "TippadRegistry: name too long");
        require(bytes(description).length <= 1000, "TippadRegistry: description too long");
        // FIX [LOW] Missing Input Validation: Added upper bound check for array parameters
        require(stackTypes.length > 0, "TippadRegistry: at least one stack type required");
        require(stackTypes.length <= MAX_STACK_TYPES, "TippadRegistry: too many stack types");
        require(fileCount > 0, "TippadRegistry: file count must be positive");

        // FIX [LOW] Input Validation: Validate each stack type string is non-empty
        for (uint256 i = 0; i < stackTypes.length; i++) {
            require(bytes(stackTypes[i]).length > 0, "TippadRegistry: empty stack type");
            require(bytes(stackTypes[i]).length <= 50, "TippadRegistry: stack type too long");
        }

        _projectCounter++;
        projectId = _projectCounter;

        _projects[projectId] = Project({
            id: projectId,
            creator: msg.sender,
            name: name,
            description: description,
            ideaHash: ideaHash,
            stackTypes: stackTypes,
            fileCount: fileCount,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true,
            totalDeployments: 0,
            tipBalance: 0
        });

        _userProjects[msg.sender].push(projectId);

        // FIX [LOW] Redundant Storage Reads: Cache user profile in storage pointer
        UserProfile storage userProfile = _users[msg.sender];
        userProfile.projectCount++;

        emit ProjectCreated(projectId, msg.sender, name, block.timestamp);
    }

    /// @notice Update project details
    /// @param projectId The project ID
    /// @param name New project name
    /// @param description New project description
    /// @param fileCount Updated file count
    function updateProject(
        uint256 projectId,
        string calldata name,
        string calldata description,
        uint256 fileCount
    ) external whenNotPaused validProject(projectId) onlyProjectOwner(projectId) {
        require(bytes(name).length > 0, "TippadRegistry: name required");
        require(bytes(name).length <= 100, "TippadRegistry: name too long");
        require(bytes(description).length <= 1000, "TippadRegistry: description too long");
        require(fileCount > 0, "TippadRegistry: file count must be positive");

        Project storage project = _projects[projectId];
        project.name = name;
        project.description = description;
        project.fileCount = fileCount;
        project.updatedAt = block.timestamp;

        emit ProjectUpdated(projectId, name, block.timestamp);
    }

    /// @notice Deactivate a project
    /// @param projectId The project ID
    function deactivateProject(uint256 projectId) external validProject(projectId) onlyProjectOwner(projectId) {
        Project storage project = _projects[projectId];
        project.isActive = false;
        project.updatedAt = block.timestamp;

        emit ProjectDeactivated(projectId, block.timestamp);
    }

    /// @notice Get project details
    /// @param projectId The project ID
    /// @return The project details
    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projectId > 0 && projectId <= _projectCounter, "TippadRegistry: invalid project ID");
        return _projects[projectId];
    }

    /// @notice Get all project IDs for a user
    /// @param user The user address
    /// @return Array of project IDs
    function getUserProjects(address user) external view returns (uint256[] memory) {
        return _userProjects[user];
    }

    /// @notice Get paginated project IDs for a user (gas-efficient for large lists)
    /// @param user The user address
    /// @param offset Starting index
    /// @param limit Maximum number of results
    /// @return ids Array of project IDs
    /// @return total Total number of projects for the user
    // FIX [LOW] Inefficient Storage Access in Loops: Added paginated getter to avoid unbounded loops
    function getUserProjectsPaginated(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory ids, uint256 total) {
        uint256[] storage allProjects = _userProjects[user];
        total = allProjects.length;

        if (offset >= total || limit == 0) {
            return (new uint256[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        ids = new uint256[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            ids[i] = allProjects[offset + i];
        }
    }

    // ============ Deployment Management ============

    /// @notice Record a new deployment
    /// @param projectId The project ID
    /// @param deploymentType Type of deployment (frontend/backend/contract)
    /// @param provider Deployment provider name
    /// @param url Deployment URL
    /// @param commitHash Git commit hash or version identifier
    /// @return deploymentId The ID of the created deployment
    function createDeployment(
        uint256 projectId,
        string calldata deploymentType,
        string calldata provider,
        string calldata url,
        string calldata commitHash
    ) external whenNotPaused validProject(projectId) onlyProjectAccess(projectId) returns (uint256 deploymentId) {
        require(bytes(deploymentType).length > 0, "TippadRegistry: deployment type required");
        require(bytes(deploymentType).length <= 50, "TippadRegistry: deployment type too long");
        require(bytes(provider).length > 0, "TippadRegistry: provider required");
        require(bytes(provider).length <= 100, "TippadRegistry: provider too long");
        require(bytes(url).length > 0, "TippadRegistry: URL required");
        require(bytes(url).length <= 500, "TippadRegistry: URL too long");
        require(bytes(commitHash).length <= 100, "TippadRegistry: commit hash too long");

        _deploymentCounter++;
        deploymentId = _deploymentCounter;

        _deployments[deploymentId] = Deployment({
            id: deploymentId,
            projectId: projectId,
            deployer: msg.sender,
            deploymentType: deploymentType,
            provider: provider,
            url: url,
            commitHash: commitHash,
            deployedAt: block.timestamp,
            isActive: true
        });

        _projectDeployments[projectId].push(deploymentId);

        // FIX [LOW] Redundant Storage Reads: Use storage pointer to batch updates
        Project storage project = _projects[projectId];
        project.totalDeployments++;
        project.updatedAt = block.timestamp;

        _users[msg.sender].deploymentCount++;

        emit DeploymentCreated(deploymentId, projectId, deploymentType, provider, block.timestamp);
    }

    /// @notice Deactivate a deployment
    /// @param deploymentId The deployment ID
    function deactivateDeployment(uint256 deploymentId) external {
        require(deploymentId > 0 && deploymentId <= _deploymentCounter, "TippadRegistry: invalid deployment ID");
        Deployment storage deployment = _deployments[deploymentId];
        require(deployment.isActive, "TippadRegistry: deployment not active");

        uint256 projectId = deployment.projectId;
        require(
            _projects[projectId].creator == msg.sender || deployment.deployer == msg.sender,
            "TippadRegistry: not authorized"
        );

        deployment.isActive = false;

        // FIX [LOW] Missing Events: Emit event for deployment deactivation
        emit DeploymentDeactivated(deploymentId, block.timestamp);
    }

    /// @notice Get deployment details
    /// @param deploymentId The deployment ID
    /// @return The deployment details
    function getDeployment(uint256 deploymentId) external view returns (Deployment memory) {
        require(deploymentId > 0 && deploymentId <= _deploymentCounter, "TippadRegistry: invalid deployment ID");
        return _deployments[deploymentId];
    }

    /// @notice Get all deployment IDs for a project
    /// @param projectId The project ID
    /// @return Array of deployment IDs
    function getProjectDeployments(uint256 projectId) external view returns (uint256[] memory) {
        return _projectDeployments[projectId];
    }

    /// @notice Get paginated deployment IDs for a project (gas-efficient)
    /// @param projectId The project ID
    /// @param offset Starting index
    /// @param limit Maximum number of results
    /// @return ids Array of deployment IDs
    /// @return total Total number of deployments for the project
    // FIX [LOW] Inefficient Storage Access in Loops: Added paginated getter
    function getProjectDeploymentsPaginated(
        uint256 projectId,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory ids, uint256 total) {
        uint256[] storage allDeployments = _projectDeployments[projectId];
        total = allDeployments.length;

        if (offset >= total || limit == 0) {
            return (new uint256[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        ids = new uint256[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            ids[i] = allDeployments[offset + i];
        }
    }

    // ============ Collaboration ============

    /// @notice Add a collaborator to a project
    /// @param projectId The project ID
    /// @param collaborator The collaborator address
    function addCollaborator(uint256 projectId, address collaborator) external validProject(projectId) onlyProjectOwner(projectId) {
        require(collaborator != address(0), "TippadRegistry: invalid collaborator address");
        require(collaborator != msg.sender, "TippadRegistry: cannot add self as collaborator");
        require(!_projectCollaborators[projectId][collaborator], "TippadRegistry: already a collaborator");

        _projectCollaborators[projectId][collaborator] = true;

        emit CollaboratorAdded(projectId, collaborator, block.timestamp);
    }

    /// @notice Remove a collaborator from a project
    /// @param projectId The project ID
    /// @param collaborator The collaborator address
    function removeCollaborator(uint256 projectId, address collaborator) external validProject(projectId) onlyProjectOwner(projectId) {
        require(_projectCollaborators[projectId][collaborator], "TippadRegistry: not a collaborator");

        _projectCollaborators[projectId][collaborator] = false;

        emit CollaboratorRemoved(projectId, collaborator, block.timestamp);
    }

    /// @notice Check if an address is a collaborator
    /// @param projectId The project ID
    /// @param user The address to check
    /// @return Whether the address is a collaborator
    function isCollaborator(uint256 projectId, address user) external view returns (bool) {
        return _projectCollaborators[projectId][user];
    }

    // ============ Tipping ============

    /// @notice Send a tip to a project creator
    /// @param projectId The project ID to tip
    function tipProject(uint256 projectId) external payable nonReentrant whenNotPaused validProject(projectId) {
        require(msg.value > 0, "TippadRegistry: tip amount must be positive");

        // FIX [LOW] Redundant Storage Reads: Cache project in storage pointer
        Project storage project = _projects[projectId];
        require(project.creator != msg.sender, "TippadRegistry: cannot tip own project");

        project.tipBalance += msg.value;
        _users[project.creator].totalTipsReceived += msg.value;

        emit TipSent(projectId, msg.sender, msg.value, block.timestamp);
    }

    /// @notice Withdraw accumulated tips for a project
    /// @param projectId The project ID
    function withdrawTips(uint256 projectId) external nonReentrant validProject(projectId) onlyProjectOwner(projectId) {
        // FIX [LOW] Redundant Storage Reads: Use storage pointer, read balance once
        Project storage project = _projects[projectId];
        uint256 balance = project.tipBalance;
        require(balance > 0, "TippadRegistry: no tips to withdraw");

        // Checks-Effects-Interactions: zero balance BEFORE external call
        project.tipBalance = 0;

        // FIX [HIGH] SWC-104: Unchecked External Call Return Value
        // Using low-level call with explicit success check and revert on failure
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if (!success) {
            // Revert state change if transfer fails
            project.tipBalance = balance;
            revert("TippadRegistry: ETH transfer failed");
        }

        emit TipWithdrawn(projectId, msg.sender, balance, block.timestamp);
    }

    // ============ Admin Functions ============

    /// @notice Transfer ownership of the contract
    /// @param newOwner The new owner address
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TippadRegistry: new owner is zero address");
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /// @notice Pause the contract
    function pause() external onlyOwner {
        require(!_paused, "TippadRegistry: already paused");
        _paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause the contract
    function unpause() external onlyOwner {
        require(_paused, "TippadRegistry: not paused");
        _paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Emergency withdraw all ETH from contract (owner only)
    /// @dev Only callable when paused for safety
    function emergencyWithdraw() external onlyOwner nonReentrant {
        require(_paused, "TippadRegistry: must be paused for emergency withdraw");

        uint256 balance = address(this).balance;
        require(balance > 0, "TippadRegistry: no balance to withdraw");

        (bool success, ) = payable(_owner).call{value: balance}("");
        require(success, "TippadRegistry: emergency withdrawal failed");

        // FIX [LOW] Missing Events: Emit event for emergency withdrawal
        emit EmergencyWithdrawal(_owner, balance, block.timestamp);
    }

    // ============ View Functions ============

    /// @notice Get the total number of projects
    /// @return The project count
    function totalProjects() external view returns (uint256) {
        return _projectCounter;
    }

    /// @notice Get the total number of deployments
    /// @return The deployment count
    function totalDeployments() external view returns (uint256) {
        return _deploymentCounter;
    }

    /// @notice Get the contract owner
    /// @return The owner address
    function owner() external view returns (address) {
        return _owner;
    }

    /// @notice Check if the contract is paused
    /// @return Whether the contract is paused
    function paused() external view returns (bool) {
        return _paused;
    }

    /// @notice Check if a user is registered
    /// @param user The user address
    /// @return Whether the user is registered
    function isRegistered(address user) external view returns (bool) {
        return _registeredUsers[user];
    }

    /// @notice Get the contract's ETH balance
    /// @return The balance in wei
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ Receive ============

    /// @dev Reject direct ETH transfers (must use tipProject)
    receive() external payable {
        revert("TippadRegistry: use tipProject() to send tips");
    }

    /// @dev Reject calls to non-existent functions
    fallback() external payable {
        revert("TippadRegistry: function does not exist");
    }
}
