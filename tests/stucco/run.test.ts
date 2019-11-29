import { execFileSync } from "child_process";
import { stucco } from "../../src/stucco/run";
import { version } from "../../src/stucco/version";

test("fetch correct stucco", async () => {
  const bin = await stucco();
  expect(execFileSync(bin.path(), ["-version"]).toString().trim()).toEqual(version);
});
