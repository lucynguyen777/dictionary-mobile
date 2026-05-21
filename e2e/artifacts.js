import fs from 'node:fs/promises';
import path from 'node:path';

function sanitizePathSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'local';
}

export function getArtifactDir(testInfo, flowName) {
  const branch = sanitizePathSegment(
    process.env.UI_TEST_BRANCH || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'local'
  );

  return path.join(process.cwd(), 'artifacts', 'ui-tests', branch, testInfo.project.name, flowName);
}

export async function captureUiArtifacts(page, testInfo, flowName) {
  const artifactDir = getArtifactDir(testInfo, flowName);
  const screenshotPath = path.join(artifactDir, 'screenshot.png');

  await fs.mkdir(artifactDir, { recursive: true });
  await page.screenshot({
    fullPage: true,
    path: screenshotPath,
  });

  await fs.writeFile(path.join(artifactDir, 'page.dom.html'), await page.content(), 'utf8');
  await fs.writeFile(path.join(artifactDir, 'visible-text.txt'), await page.locator('body').innerText(), 'utf8');

  await testInfo.attach(`${flowName}-screenshot`, {
    contentType: 'image/png',
    path: screenshotPath,
  });
}
