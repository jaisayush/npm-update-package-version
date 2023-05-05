const axios = require("axios");
const mockAxios = require("axios").default;
const { getLatestVersions } = require("./index");

jest.mock("axios");

describe("getLatestVersions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should handle errors when getting latest versions of dependencies", async () => {
    mockAxios.get.mockRejectedValueOnce(
      new Error("Failed to get latest versions")
    );

    await expect(getLatestVersions()).rejects.toThrow(
      "Failed to get latest versions"
    );
  });
});
