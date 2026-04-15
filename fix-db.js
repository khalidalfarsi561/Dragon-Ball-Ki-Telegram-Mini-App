import PocketBase from "pocketbase";

const PB_URL = "http://127.0.0.1:8090";
const PB_EMAIL = "khalidalfarsi1995@gmail.com";
const PB_PASSWORD = "Y@123456789yyy";

const pb = new PocketBase(PB_URL);

const usersCollectionPatch = {
  schema: [
    {
      name: "balance_ki",
      type: "number",
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    },
    {
      name: "total_ki",
      type: "number",
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    },
    {
      name: "energy",
      type: "number",
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    },
    {
      name: "level",
      type: "relation",
      system: false,
      required: false,
      unique: false,
      options: {
        collectionId: "levels",
        maxSelect: 1,
        cascadeDelete: false,
        minSelect: 0,
        displayFields: ["name"],
      },
    },
  ],
};

const levelsCollection = {
  name: "levels",
  type: "base",
  system: false,
  schema: [
    {
      name: "name",
      type: "text",
      system: false,
      required: true,
      unique: true,
      options: {
        min: null,
        max: null,
        pattern: "",
      },
    },
    {
      name: "min_ki",
      type: "number",
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    },
    {
      name: "multiplier",
      type: "number",
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    },
    {
      name: "image_url",
      type: "text",
      system: false,
      required: false,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: "",
      },
    },
  ],
};

const cardsCollection = {
  name: "cards",
  type: "base",
  system: false,
  schema: [
    {
      name: "name",
      type: "text",
      system: false,
      required: true,
      unique: true,
      options: {
        min: null,
        max: null,
        pattern: "",
      },
    },
    {
      name: "description",
      type: "text",
      system: false,
      required: false,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: "",
      },
    },
    {
      name: "cost",
      type: "number",
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    },
    {
      name: "income_per_hour",
      type: "number",
      system: false,
      required: true,
      unique: false,
      options: {
        min: null,
        max: null,
        noDecimal: false,
      },
    },
    {
      name: "category",
      type: "text",
      system: false,
      required: false,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: "",
      },
    },
    {
      name: "image_url",
      type: "text",
      system: false,
      required: false,
      unique: false,
      options: {
        min: null,
        max: null,
        pattern: "",
      },
    },
  ],
};

async function updateUsersCollection() {
  const users = await pb.collections.getFirstListItem('name="users"');
  try {
    await pb.collections.update(users.id, usersCollectionPatch);
    console.log("Updated existing users collection.");
  } catch (error) {
    console.error(
      "Failed to update users collection:",
      error?.message || error,
    );
  }
}

async function createCollectionIfMissing(collection) {
  try {
    await pb.collections.create(collection);
    console.log(`Created collection: ${collection.name}`);
  } catch (error) {
    console.error(
      `Failed to create ${collection.name}:`,
      error?.message || error,
    );
  }
}

async function main() {
  try {
    await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
    console.log("Authenticated as admin.");

    await updateUsersCollection();
    await createCollectionIfMissing(levelsCollection);
    await createCollectionIfMissing(cardsCollection);
  } catch (error) {
    console.error("Database fix failed:", error?.message || error);
    process.exitCode = 1;
  }
}

main();
