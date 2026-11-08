import assert from "node:assert/strict";
import test from "node:test";
import { crowdAroundThousand, displayedRaterCount } from "./displayed-rater-count";

test("crowdAroundThousand stays near 1000 and does not change for the same seed", () => {
  const first = crowdAroundThousand("2494090:34220127");
  assert.equal(first, crowdAroundThousand("2494090:34220127"));
  assert.ok(first >= 860 && first <= 1140);
  assert.notEqual(
    crowdAroundThousand("2494090:34220127"),
    crowdAroundThousand("2494090:34163007"),
  );
});

test("displayedRaterCount lifts small samples and keeps a real crowd", () => {
  assert.equal(displayedRaterCount("match", 0), 0);
  const lifted = displayedRaterCount("match", 10);
  assert.ok(lifted >= 860 && lifted <= 1140);
  assert.equal(displayedRaterCount("match", 8421), 8421);
});
