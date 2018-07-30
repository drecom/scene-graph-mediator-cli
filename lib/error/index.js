"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = Object.freeze({
    None: 0,
    EnviromentVariableMissing: 1,
    RuntimeNotSupported: 2
});
function exit(code) {
    console.log("error(" + code + ")");
    process.exit(code);
}
exports.exit = exit;
//# sourceMappingURL=index.js.map