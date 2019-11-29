import { DevNull } from "../../src/server/devnull";

describe("dev null", () => {
    it("calls callback as second argument", (done) => {
        const devNull = new DevNull();
        const cb = jest.fn(() => {
            expect(cb).toHaveBeenCalled();
            done();
        });
        devNull.write("", cb);
    });
    it("calls callback as third argument", (done) => {
        const devNull = new DevNull();
        const cb = jest.fn(() => {
            expect(cb).toHaveBeenCalled();
            done();
        });
        devNull.write("", "undefined", cb);
    });
});
