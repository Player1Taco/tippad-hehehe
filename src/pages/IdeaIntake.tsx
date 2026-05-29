import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useContractStatus } from '../hooks/useContractStatus';
import type { IdeaIntake as IdeaIntakeType, QuestionStep } from '../types';
import GlowCard from '../components/GlowCard';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  Plus,
  Lightbulb,
  AlertTriangle,
  ShieldOff,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const questions: QuestionStep[] = [
  {
    id: 'name',
    question: 'What should we call your app?',
    description: 'Choose a memorable name for your application.',
    type: 'text',
    placeholder: 'e.g., SwapVault, TaskFlow, ArtMarket',
    required: true,
    field: 'appName',
  },
  {
    id: 'purpose',
    question: 'What does your app do?',
    description: 'Describe the main purpose in 1-2 sentences.',
    type: 'textarea',
    placeholder: 'e.g., A decentralized marketplace where artists can mint and sell digital artwork as NFTs...',
    required: true,
    field: 'appPurpose',
  },
  {
    id: 'users',
    question: 'Who is this app for?',
    description: 'Describe your target audience.',
    type: 'text',
    placeholder: 'e.g., Crypto traders, small business owners, gamers...',
    required: true,
    field: 'targetUsers',
  },
  {
    id: 'features',
    question: 'What are the main features?',
    description: 'Add the key features your app needs (at least 2).',
    type: 'multiselect',
    options: [
      'User Authentication',
      'Dashboard & Analytics',
      'Real-time Notifications',
      'Search & Filtering',
      'File Upload',
      'Payment Processing',
      'Social Features',
      'Admin Panel',
      'API Integration',
      'Data Visualization',
    ],
    required: true,
    field: 'mainFeatures',
  },
  {
    id: 'interactions',
    question: 'Describe key user interactions',
    description: 'What should users be able to do? Walk us through the main flow.',
    type: 'textarea',
    placeholder: 'e.g., Users sign up, browse listings, place bids, and receive notifications when they win...',
    required: false,
    field: 'interactions',
  },
  {
    id: 'blockchain',
    question: 'Does your app need blockchain features?',
    description: 'Enable Solana smart contract generation for Web3 functionality.',
    type: 'toggle',
    required: true,
    field: 'hasBlockchain',
  },
  {
    id: 'blockchainFeatures',
    question: 'Which blockchain features do you need?',
    description: 'Select the Web3 capabilities for your app.',
    type: 'multiselect',
    options: [
      'Token Transfers',
      'NFT Minting',
      'Staking & Rewards',
      'Governance & Voting',
      'Payment Processing',
      'Token Swap',
      'Escrow System',
      'On-chain Storage',
    ],
    required: false,
    field: 'blockchainFeatures',
  },
  {
    id: 'design',
    question: 'What design style do you prefer?',
    description: 'Choose the visual aesthetic for your app.',
    type: 'select',
    options: ['minimal', 'bold', 'corporate', 'playful'],
    required: true,
    field: 'designStyle',
  },
  {
    id: 'notes',
    question: 'Anything else we should know?',
    description: 'Additional requirements, integrations, or special requests.',
    type: 'textarea',
    placeholder: 'e.g., Must support mobile, needs dark mode, integrate with Stripe...',
    required: false,
    field: 'additionalNotes',
  },
];

export default function IdeaIntake() {
  const { createProject, setView } = useAppStore();
  const { isPaused, isLoading: isCheckingContract, error: contractError, refetch: refetchContractStatus } = useContractStatus();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<IdeaIntakeType>>({
    appName: '',
    appPurpose: '',
    targetUsers: '',
    mainFeatures: [],
    interactions: '',
    hasBlockchain: false,
    blockchainFeatures: [],
    designStyle: 'bold',
    additionalNotes: '',
  });
  const [customFeature, setCustomFeature] = useState('');

  const visibleQuestions = questions.filter((q) => {
    if (q.id === 'blockchainFeatures' && !formData.hasBlockchain) return false;
    return true;
  });

  const currentQuestion = visibleQuestions[currentStep];
  const totalSteps = visibleQuestions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = () => {
    // Block progression if contract is paused
    if (isPaused) return false;
    if (!currentQuestion.required) return true;
    const value = formData[currentQuestion.field];
    if (currentQuestion.type === 'multiselect') return Array.isArray(value) && value.length >= 2;
    if (currentQuestion.type === 'toggle') return true;
    return typeof value === 'string' && value.trim().length > 0;
  };

  const handleNext = () => {
    if (isPaused) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // Final pause check before submission
    if (isPaused) return;

    const idea: IdeaIntakeType = {
      appName: formData.appName || 'My App',
      appPurpose: formData.appPurpose || '',
      targetUsers: formData.targetUsers || '',
      mainFeatures: formData.mainFeatures || [],
      interactions: formData.interactions || '',
      hasBlockchain: formData.hasBlockchain || false,
      blockchainFeatures: formData.blockchainFeatures || [],
      designStyle: formData.designStyle || 'bold',
      additionalNotes: formData.additionalNotes || '',
    };
    createProject(idea);
    setView('generating');
  };

  const toggleMultiSelect = (field: keyof IdeaIntakeType, value: string) => {
    const current = (formData[field] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      const current = (formData.mainFeatures as string[]) || [];
      setFormData({ ...formData, mainFeatures: [...current, customFeature.trim()] });
      setCustomFeature('');
    }
  };

  // Show loading state while checking contract status
  if (isCheckingContract) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="fixed top-40 right-20 w-72 h-72 bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-40 left-20 w-72 h-72 bg-secondary/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-2xl p-10 border border-border/50">
            <Loader2 size={40} className="mx-auto text-primary animate-spin mb-4" />
            <h2 className="text-xl font-bold mb-2">Checking Contract Status</h2>
            <p className="text-text-secondary text-sm">
              Verifying TippadRegistry is operational...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show paused state banner and block form
  if (isPaused) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="fixed top-40 right-20 w-72 h-72 bg-error/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-40 left-20 w-72 h-72 bg-warning/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-lg text-center animate-slide-up">
          <div className="glass rounded-3xl p-10 sm:p-12 border border-error/20 relative overflow-hidden">
            {/* Animated warning background */}
            <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-warning/5 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-error via-warning to-error animate-gradient-shift bg-300%" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-6">
                <ShieldOff size={36} className="text-error" />
              </div>

              <h1 className="text-3xl font-bold mb-3">
                <span className="text-error">Contract Paused</span>
              </h1>

              <p className="text-text-secondary text-lg mb-2 leading-relaxed">
                The TippadRegistry smart contract is currently paused by the contract owner.
              </p>
              <p className="text-text-secondary text-sm mb-8">
                Project creation and on-chain transactions are temporarily unavailable. This is typically done for maintenance or security purposes.
              </p>

              <div className="glass rounded-xl p-4 border border-warning/20 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning mb-1">What does this mean?</p>
                    <ul className="text-xs text-text-secondary space-y-1">
                      <li>• New project creation is temporarily disabled</li>
                      <li>• On-chain project registration is unavailable</li>
                      <li>• Existing projects and code remain safe</li>
                      <li>• Service will resume once the contract is unpaused</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={refetchContractStatus}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 transition-all hover:shadow-[0_0_30px_rgba(158,127,255,0.3)]"
                >
                  <RefreshCw size={18} />
                  Check Again
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-border hover:border-primary/30 text-text-secondary hover:text-white transition-all"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-text-secondary/50 mt-6">
            Contract status is checked automatically every 30 seconds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Background effects */}
      <div className="fixed top-40 right-20 w-72 h-72 bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-40 left-20 w-72 h-72 bg-secondary/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Contract error warning banner (non-blocking) */}
      {contractError && (
        <div className="w-full max-w-2xl mb-4 animate-slide-down">
          <div className="glass rounded-xl px-4 py-3 border border-warning/20 flex items-center gap-3">
            <AlertTriangle size={16} className="text-warning flex-shrink-0" />
            <p className="text-sm text-warning/80 flex-1">
              Unable to verify contract status: {contractError}. Proceeding with caution.
            </p>
            <button
              onClick={refetchContractStatus}
              className="p-1.5 rounded-lg hover:bg-surface-light transition-colors text-warning/60 hover:text-warning"
              title="Retry contract status check"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-secondary">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm font-mono text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="animate-slide-up" key={currentQuestion.id}>
          <GlowCard className="p-8 sm:p-10" hover={false}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{currentQuestion.question}</h2>
                <p className="text-text-secondary">{currentQuestion.description}</p>
              </div>
            </div>

            <div className="mt-6">
              {currentQuestion.type === 'text' && (
                <input
                  type="text"
                  value={(formData[currentQuestion.field] as string) || ''}
                  onChange={(e) => setFormData({ ...formData, [currentQuestion.field]: e.target.value })}
                  placeholder={currentQuestion.placeholder}
                  className="w-full px-5 py-4 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-text-secondary/50 transition-all text-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                />
              )}

              {currentQuestion.type === 'textarea' && (
                <textarea
                  value={(formData[currentQuestion.field] as string) || ''}
                  onChange={(e) => setFormData({ ...formData, [currentQuestion.field]: e.target.value })}
                  placeholder={currentQuestion.placeholder}
                  rows={4}
                  className="w-full px-5 py-4 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-white placeholder-text-secondary/50 transition-all resize-none text-lg"
                  autoFocus
                />
              )}

              {currentQuestion.type === 'select' && (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({ ...formData, [currentQuestion.field]: option })}
                      className={`px-5 py-4 rounded-xl border text-left transition-all capitalize font-medium ${
                        formData[currentQuestion.field] === option
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border hover:border-primary/30 text-text-secondary hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData[currentQuestion.field] === option ? 'border-primary' : 'border-border'
                        }`}>
                          {formData[currentQuestion.field] === option && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                        {option}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiselect' && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentQuestion.options?.map((option) => {
                      const selected = ((formData[currentQuestion.field] as string[]) || []).includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => toggleMultiSelect(currentQuestion.field, option)}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            selected
                              ? 'border-primary bg-primary/15 text-white'
                              : 'border-border hover:border-primary/30 text-text-secondary hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {selected ? <Check size={14} className="text-primary" /> : <Plus size={14} />}
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {currentQuestion.field === 'mainFeatures' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFeature}
                        onChange={(e) => setCustomFeature(e.target.value)}
                        placeholder="Add custom feature..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 outline-none text-white placeholder-text-secondary/50 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && addCustomFeature()}
                      />
                      <button
                        onClick={addCustomFeature}
                        className="px-4 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {/* Show custom features */}
                  {currentQuestion.field === 'mainFeatures' && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {((formData.mainFeatures as string[]) || [])
                        .filter((f) => !currentQuestion.options?.includes(f))
                        .map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1.5 rounded-lg bg-accent/15 text-accent text-sm flex items-center gap-2"
                          >
                            {feature}
                            <button
                              onClick={() => toggleMultiSelect('mainFeatures', feature)}
                              className="hover:text-white transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'toggle' && (
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setFormData({ ...formData, hasBlockchain: true })}
                    className={`flex-1 px-6 py-5 rounded-xl border transition-all ${
                      formData.hasBlockchain
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">⛓️</div>
                    <div className="font-semibold mb-1">Yes, add Web3</div>
                    <div className="text-sm text-text-secondary">Generate Solana smart contracts</div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, hasBlockchain: false, blockchainFeatures: [] })}
                    className={`flex-1 px-6 py-5 rounded-xl border transition-all ${
                      !formData.hasBlockchain
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">🌐</div>
                    <div className="font-semibold mb-1">No, Web2 only</div>
                    <div className="text-sm text-text-secondary">Standard frontend + backend</div>
                  </button>
                </div>
              )}
            </div>
          </GlowCard>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'text-text-secondary/30 cursor-not-allowed'
                : 'text-text-secondary hover:text-white hover:bg-surface-light'
            }`}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              canProceed()
                ? 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(158,127,255,0.3)]'
                : 'bg-surface-light text-text-secondary/50 cursor-not-allowed'
            }`}
          >
            {currentStep === totalSteps - 1 ? (
              <>
                <Sparkles size={18} />
                Generate App
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
