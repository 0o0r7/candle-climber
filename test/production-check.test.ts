// LU-9 pin: the production database warning — loud when prod runs in-memory,
// silent in dev, and ALWAYS non-throwing (fail-open boot).
import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import { checkProductionDatabase, _resetProductionCheck } from "../src/lib/production-check";

const ENV = process.env as Record<string, string | undefined>;
const REAL_ENV = ENV["NODE_ENV"];
const REAL_LOG = console.warn;

beforeEach(() => _resetProductionCheck());

afterEach(() => {
  ENV["NODE_ENV"] = REAL_ENV;
  console.warn = REAL_LOG;
});

describe("production database check (LU-9)", () => {
  test("never throws, even with a broken environment", () => {
    ENV["NODE_ENV"] = "production";
    delete process.env.DATABASE_URL;
    expect(() => checkProductionDatabase()).not.toThrow();
  });

  test("production without DATABASE_URL emits exactly one loud warning", () => {
    ENV["NODE_ENV"] = "production";
    delete process.env.DATABASE_URL;
    const calls: string[] = [];
    console.warn = (msg: unknown) => calls.push(String(msg));
    checkProductionDatabase();
    checkProductionDatabase(); // second call is a no-op (warn-once guard)
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain("LU-9");
    expect(calls[0]).toContain("IN-MEMORY");
  });

  test("production WITH a MongoDB URI stays silent", () => {
    ENV["NODE_ENV"] = "production";
    process.env.DATABASE_URL = "mongodb+srv://cluster.example/test";
    const calls: string[] = [];
    console.warn = (msg: unknown) => calls.push(String(msg));
    checkProductionDatabase();
    expect(calls.length).toBe(0);
  });

  test("non-mongo production URL still warns (postgres:// is not a store we run)", () => {
    ENV["NODE_ENV"] = "production";
    process.env.DATABASE_URL = "postgres://localhost/app";
    const calls: string[] = [];
    console.warn = (msg: unknown) => calls.push(String(msg));
    checkProductionDatabase();
    expect(calls.length).toBe(1);
  });

  test("development never warns (dev default in-memory is intended)", () => {
    ENV["NODE_ENV"] = "development";
    delete process.env.DATABASE_URL;
    const calls: string[] = [];
    console.warn = (msg: unknown) => calls.push(String(msg));
    checkProductionDatabase();
    expect(calls.length).toBe(0);
  });
});
