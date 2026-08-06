// Tests for infrastructure/repositories/userRepository.ts — focuses on the login
// lookup, which can no longer ask MongoDB to match the password and has to
// verify the hash in code instead.
import { hashPassword } from "../../domain/password.js";

jest.mock("../../infrastructure/models/UserModel.js", () => ({
  UserModel: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
}));

import { findUserByUsernameAndPassword } from "../../infrastructure/repositories/userRepository.js";
import { UserModel } from "../../infrastructure/models/UserModel.js";

/** Mimics the Mongoose chain used by the repository: findOne(...).select(...).lean() */
const mockFindOne = (doc: unknown) => {
  jest.mocked(UserModel.findOne).mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(doc) }),
  } as never);
};

const storedUser = (password: string) => ({
  id: "1",
  username: "alice",
  password,
  role: "user",
  status: "active",
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(UserModel.updateOne).mockResolvedValue({} as never);
});

describe("findUserByUsernameAndPassword", () => {
  it("returns the user when the password matches the stored hash", async () => {
    mockFindOne(storedUser(hashPassword("password123")));

    const user = await findUserByUsernameAndPassword("alice", "password123");
    expect(user?.username).toBe("alice");
  });

  it("returns undefined when the password is wrong", async () => {
    mockFindOne(storedUser(hashPassword("password123")));

    const user = await findUserByUsernameAndPassword("alice", "wrong-password");
    expect(user).toBeUndefined();
  });

  it("returns undefined when the username does not exist", async () => {
    mockFindOne(null);

    const user = await findUserByUsernameAndPassword("nobody", "password123");
    expect(user).toBeUndefined();
  });

  it("only ever looks up active accounts", async () => {
    // Blocked and deleted users must not be able to log in, so the status
    // filter has to stay part of the query.
    mockFindOne(null);
    await findUserByUsernameAndPassword("alice", "password123");

    expect(UserModel.findOne).toHaveBeenCalledWith({
      username: "alice",
      status: "active",
    });
  });

  it("never sends the password to the database", async () => {
    mockFindOne(storedUser(hashPassword("password123")));
    await findUserByUsernameAndPassword("alice", "password123");

    const query = jest.mocked(UserModel.findOne).mock.calls[0]?.[0];
    expect(JSON.stringify(query)).not.toContain("password123");
  });
});

describe("legacy plain-text accounts", () => {
  it("logs in and upgrades the stored password to a hash", async () => {
    mockFindOne(storedUser("password123"));

    const user = await findUserByUsernameAndPassword("alice", "password123");

    expect(user?.username).toBe("alice");
    expect(UserModel.updateOne).toHaveBeenCalledTimes(1);

    // The account is rewritten with a hash, not the original plain text
    const [filter, update] = jest.mocked(UserModel.updateOne).mock
      .calls[0] as unknown as [Record<string, unknown>, { password: string }];
    expect(filter).toEqual({ id: "1" });
    expect(update.password).toMatch(/^scrypt:/);
    expect(update.password).not.toContain("password123");
  });

  it("does not upgrade when the password is wrong", async () => {
    mockFindOne(storedUser("password123"));

    await findUserByUsernameAndPassword("alice", "wrong-password");
    expect(UserModel.updateOne).not.toHaveBeenCalled();
  });

  it("leaves an already-hashed password untouched", async () => {
    mockFindOne(storedUser(hashPassword("password123")));

    await findUserByUsernameAndPassword("alice", "password123");
    expect(UserModel.updateOne).not.toHaveBeenCalled();
  });
});
