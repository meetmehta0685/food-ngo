document.querySelectorAll("[data-quiz]").forEach((quiz) => {
  const correct = quiz.dataset.correct;
  const feedback = quiz.querySelector("[data-quiz-feedback]");

  quiz.querySelectorAll("[data-option]").forEach((option) => {
    option.addEventListener("click", () => {
      quiz.querySelectorAll("[data-option]").forEach((item) => {
        item.removeAttribute("data-state");
      });

      const isCorrect = option.dataset.option === correct;
      option.dataset.state = isCorrect ? "correct" : "wrong";

      if (feedback) {
        feedback.textContent = isCorrect
          ? option.dataset.feedback || "Correct. Now explain why in your own words."
          : "Not yet. Re-open the trace and find the layer that owns this decision.";
      }
    });
  });
});
