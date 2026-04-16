"use client"

import { Button } from "@/components/ui/genericos/button"

type Step = {
  id: number
  label: string
}

type StepperProps = {
  steps: Step[]
  currentStep: number
  onPrev: () => void
  onNext: () => void
  maxStep: number
  canGoNext: boolean
}

export default function Stepper({
  steps,
  currentStep,
  onPrev,
  onNext,
  maxStep,
  canGoNext,
}: StepperProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            <span
              className={[
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                step.id === currentStep
                  ? "bg-slate-900 text-white"
                  : step.id < currentStep
                    ? "bg-slate-200 text-slate-700"
                    : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {step.id}
            </span>
            <span className={step.id === currentStep ? "font-medium text-slate-900" : ""}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onNext}
          disabled={currentStep === maxStep || !canGoNext}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
