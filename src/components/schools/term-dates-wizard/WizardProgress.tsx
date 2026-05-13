interface WizardProgressProps {
  currentStep: 1 | 2 | 3;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const steps = [
    { number: 1, label: 'Website' },
    { number: 2, label: 'Term Dates Page' },
    { number: 3, label: 'Extract & Review' },
  ];

  return (
    <div className="mb-4 pb-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step.number === currentStep
                  ? 'bg-primary text-white'
                  : step.number < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step.number < currentStep ? '✓' : step.number}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of 3
        </div>
      </div>
      <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-2">
            <div className={step.number === currentStep ? 'font-medium text-primary' : ''}>
              {step.label}
            </div>
            {index < steps.length - 1 && <div>→</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
