import test from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/index.js";

const now = 1_800_000_000_000;
const valid = { app: "chat-library", appName: "Chat Library", happened: "It closed.", expected: "It should remain open.", openedAt: String(now - 3000) };

test("accepts a minimal report", () => assert.equal(validate(valid, now).report.app, "chat-library"));
test("requires both descriptions", () => assert.ok(validate({ ...valid, happened: "" }, now).error));
test("silently accepts the honeypot", () => assert.equal(validate({ ...valid, website: "spam" }, now).ignored, true));
test("rejects forms submitted too quickly", () => assert.ok(validate({ ...valid, openedAt: String(now) }, now).error));
test("rejects an invalid optional reply address", () => assert.ok(validate({ ...valid, replyEmail: "wrong" }, now).error));
