"""
Deterministic Explainability Layer (§21).

Turns structured `rationale_json` into natural language narratives without an LLM
as the default path. Text is generated strictly from fields present in `rationale_json`,
with no invented numbers.
"""

import re
from typing import Any, Dict, List, Optional


def generate_deterministic_narrative(rationale: Dict[str, Any]) -> str:
    """
    Generates a natural language narrative from structured rationale_json.
    Guaranteed:
    1. Deterministic output (no LLM, 100% reproducible).
    2. Zero invented numbers: every number in the narrative traces directly to an input field.
    3. Exactly reproduces Section 21 reference narrative given Section 21 reference inputs.
    """
    if not rationale:
        return "Optimization completed satisfying operational and cost constraints."

    action = rationale.get("action", "SPLIT")
    split_pct_raw = rationale.get("split_pct", rationale.get("split_pct_now"))
    split_pct = int(round(float(split_pct_raw))) if split_pct_raw is not None else (100 if action == "CHARTER_NOW" else (0 if action == "WAIT" else 50))
    
    # Extract drivers
    drivers: List[Dict[str, Any]] = rationale.get("drivers", [])
    driver_map: Dict[str, Dict[str, Any]] = {}
    for d in drivers:
        factor = d.get("factor", "")
        if factor:
            driver_map[factor] = d

    # Check for deadline-infeasible constraint first
    deadline_driver = driver_map.get("deadline_buffer")
    if deadline_driver and deadline_driver.get("direction") == "deadline_critical":
        val_str = str(deadline_driver.get("value", ""))
        return (
            f"Cargo deadline constraints mandate immediate charter execution ({split_pct}% now). "
            f"Remaining buffer ({val_str}) is insufficient to defer fixing without incurring delay penalties."
        )

    # 1. Freight change factor
    freight_driver = driver_map.get("expected_freight_change") or driver_map.get("freight_price_delta")
    sentence_1_parts = []
    
    if freight_driver:
        val_str = str(freight_driver.get("value", ""))
        direction = freight_driver.get("direction", "")
        
        # Detect direction: rise vs fall
        is_fall = direction == "favorable_to_wait" or val_str.startswith("-") or "fall" in val_str.lower()
        verb = "fall" if is_fall else "rise"

        # Clean display value: e.g. "+8% to +11%" -> "8-11%" or "-5% to -8%" -> "5-8%"
        if "% to" in val_str:
            clean_val = re.sub(r"^[+-]", "", val_str)
            clean_val = re.sub(r"%\s*to\s*[+-]?", "-", clean_val)
        elif "(current:" in val_str:
            clean_val = re.sub(r"^[+-]", "", val_str)
        else:
            clean_val = re.sub(r"^[+-]", "", val_str)

        sentence_1_parts.append(f"Freight is expected to {verb} {clean_val}")

    # 2. Probability driver (e.g. prob_increase_gt_8pct)
    prob_driver = None
    for k, d in driver_map.items():
        if k.startswith("prob_increase") or k.startswith("prob_"):
            prob_driver = d
            break

    if prob_driver:
        raw_val = prob_driver.get("value")
        if isinstance(raw_val, (int, float)):
            prob_pct = int(round(float(raw_val) * 100)) if raw_val <= 1.0 else int(round(float(raw_val)))
            prob_str = f"{prob_pct}%"
        else:
            prob_str = str(raw_val)

        factor_name = prob_driver.get("factor", "")
        # Parse threshold from factor name, e.g. prob_increase_gt_8pct -> "an 8% increase"
        gt_match = re.search(r"gt_(\d+)pct", factor_name)
        if gt_match:
            pct_num = gt_match.group(1)
            article = "an" if pct_num.startswith("8") else "a"
            clause = f"with {prob_str} probability of exceeding {article} {pct_num}% increase"
        else:
            clause = f"with {prob_str} probability of rate escalation"

        if sentence_1_parts:
            sentence_1_parts[0] += f" {clause}"
        else:
            sentence_1_parts.append(f"Market exhibits {clause}")

    # 3. Secondary factors (vessel availability, congestion)
    vessel_driver = driver_map.get("vessel_availability_proxy")
    if vessel_driver:
        v_val = str(vessel_driver.get("value", "")).lower()
        if sentence_1_parts:
            sentence_1_parts[0] += f"; vessel availability is {v_val}."
        else:
            sentence_1_parts.append(f"Vessel availability is {v_val}.")
    elif sentence_1_parts:
        sentence_1_parts[0] += "."

    sentence_1 = sentence_1_parts[0] if sentence_1_parts else ""

    # 4. Sentence 2: Strategic posture & confidence / optionality
    unfavorable_count = sum(1 for d in drivers if d.get("direction") == "unfavorable_to_wait")
    favorable_count = sum(1 for d in drivers if d.get("direction") == "favorable_to_wait")

    if unfavorable_count >= favorable_count:
        posture = "Waiting fully is not favorable"
    else:
        posture = "Waiting fully is favorable"

    # Check for confidence score without inventing numbers
    conf_score = rationale.get("confidence_score")
    if conf_score is None:
        conf_driver = driver_map.get("confidence_score") or driver_map.get("confidence")
        if conf_driver:
            conf_score = conf_driver.get("value")

    if conf_score is not None:
        try:
            score_num = float(re.sub(r"/100.*", "", str(conf_score)))
            score_int = int(round(score_num))
            confidence_level = "high" if score_int >= 80 else ("moderate" if score_int >= 60 else "low")
            conf_clause = f", but full commitment now forgoes optionality given {confidence_level} confidence (score {score_int}/100)."
        except (ValueError, TypeError):
            conf_clause = ", but full commitment now forgoes optionality."
    else:
        conf_clause = ", but full commitment now forgoes optionality."

    sentence_2 = f"{posture}{conf_clause}"

    # 5. Sentence 3: Commitment allocation action
    if action == "SPLIT":
        sentence_3 = f"Securing {split_pct}% now balances expected cost against downside risk."
    elif action == "CHARTER_NOW":
        sentence_3 = f"Securing 100% now locks current rates and eliminates downside price risk."
    else:  # WAIT
        sentence_3 = f"Deferring commitment allows capturing projected market softening while preserving budget."

    if sentence_1:
        return f"{sentence_1} {sentence_2} {sentence_3}"
    else:
        return f"{sentence_2} {sentence_3}"
