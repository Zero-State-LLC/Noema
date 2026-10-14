# src/noema/research/lab/intervention.py

- validate_intervention · function · L20-L40 — def validate_intervention(iv: dict[str, Any]) -> dict[str, Any]
- apply_intervention · function · L43-L65 — def apply_intervention(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]
- _apply_ablation · function · L68-L89 — def _apply_ablation(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]
- _apply_perturbation · function · L92-L131 — def _apply_perturbation(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]
- _apply_counterfactual · function · L134-L152 — def _apply_counterfactual(world: ExperimentalWorld, iv: dict[str, Any]) -> dict[str, Any]: # counterfactual requires complete before/after variable declaration
- restore_on_run_end · function · L155-L158 — def restore_on_run_end(world: ExperimentalWorld) -> None
- validate_counterfactual_record · function · L161-L169 — def validate_counterfactual_record(cf: dict[str, Any]) -> dict[str, Any]
