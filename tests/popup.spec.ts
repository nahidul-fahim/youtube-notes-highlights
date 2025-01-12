// @ts-check
const { test, expect } = require("@playwright/test");
import { getBrowserStackContext, sleep } from "../playwright-test";

test("YouTube video note-taking extension test", async () => {
  const context = await getBrowserStackContext("chrome", "windows", "10");
  const page = await context.newPage();

  // Navigate to a YouTube video
  await page.goto("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  // Add your test logic here to interact with your popup.js functionality
  // Example: Check if the popup displays the correct video title
  // const videoTitleElement = await page.evaluate(() => document.getElementById("videoTitle"))
  const videoTitleElement = await page.$("#videoTitle");
  if (videoTitleElement) {
    const videoTitle = await videoTitleElement.textContent();
    expect(videoTitle).toContain("Rick Astley - Never Gonna Give You Up"); // Example video title
  } else {
    throw new Error("video title element not found!");
  }

  // Save a note and check if it's displayed correctly
  await page.evaluate(() => {
    const noteTextElement = document.getElementById(
      "noteText"
    ) as HTMLInputElement;
    const saveNoteButton = document.getElementById("saveNote");
    if (noteTextElement && saveNoteButton) {
      noteTextElement.value = "This is a test note";
      saveNoteButton.click();
    } else {
      console.error("Element not found!");
    }
  });

  // Wait for note to be saved
  await sleep(2000);

  const noteText = await page.evaluate(() => {
    const noteElement = document.querySelector("#notesList li a");
    if (noteElement) {
      return noteElement.textContent;
    } else {
      return null;
    }
  });

  if (noteText) {
    expect(noteText).toContain("This is a test note");
  } else {
    throw new Error("Note text element not found");
  }

  await page.close();
  await context.close();
});
