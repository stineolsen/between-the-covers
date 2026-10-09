import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import wrappedApi from "../api/wrappedApi";
import Stepper from "../components/wrapped/Stepper";
import ConfirmReadingListStep from "../components/wrapped/ConfirmReadingListStep";
import RankBookclubStep from "../components/wrapped/RankBookclubStep";
import AwardsStep from "../components/wrapped/AwardsStep";
import WrappedDone from "../components/wrapped/WrappedDone";

const year = new Date().getFullYear();

const Bokwrapped = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState({
    confirmList: false,
    ranking: false,
    awards: false,
  });

  const stepParam = searchParams.get("step");
  const step = stepParam === "done" ? "done" : Number(stepParam) || null;

  useEffect(() => {
    wrappedApi
      .getStatus(year)
      .then((data) => {
        setCompleted(data.stepsCompleted);
        if (!stepParam) {
          if (data.stepsCompleted.awards) {
            setSearchParams({ step: "done" }, { replace: true });
          } else if (data.stepsCompleted.ranking) {
            setSearchParams({ step: "3" }, { replace: true });
          } else if (data.stepsCompleted.confirmList) {
            setSearchParams({ step: "2" }, { replace: true });
          } else {
            setSearchParams({ step: "1" }, { replace: true });
          }
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goStep = (n) => setSearchParams({ step: String(n) });

  if (loading || !step) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p style={{ color: "var(--color-text-muted)" }}>Laster...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <p
          className="text-xs font-bold uppercase tracking-wide mb-1"
          style={{ color: "var(--color-text-faint)" }}
        >
          BTC Bokwrapped {year}
        </p>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
          Oppsummer leseåret ditt
        </h1>
      </div>

      <div className="card rounded-2xl p-6">
        {step !== "done" && (
          <Stepper current={step} completed={completed} onStepClick={goStep} />
        )}

        {step === 1 && (
          <ConfirmReadingListStep
            year={year}
            onNext={() => {
              setCompleted((c) => ({ ...c, confirmList: true }));
              goStep(2);
            }}
          />
        )}

        {step === 2 && (
          <RankBookclubStep
            year={year}
            onBack={() => goStep(1)}
            onNext={() => {
              setCompleted((c) => ({ ...c, ranking: true }));
              goStep(3);
            }}
          />
        )}

        {step === 3 && (
          <AwardsStep
            year={year}
            onBack={() => goStep(2)}
            onSubmitted={() => {
              setCompleted((c) => ({ ...c, awards: true }));
              setSearchParams({ step: "done" });
            }}
          />
        )}

        {step === "done" && <WrappedDone onEdit={() => goStep(1)} />}
      </div>
    </div>
  );
};

export default Bokwrapped;
