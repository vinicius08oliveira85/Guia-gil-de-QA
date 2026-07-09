import { describe, expect, it } from 'vitest';
import { appendScreenshotsFromFiles } from '../../../components/project/BusinessRuleScreenshotUpload';
import { MAX_BUSINESS_RULE_SCREENSHOTS } from '../../../utils/businessRuleDefaults';

function makeImageFile(name: string, sizeBytes: number, type = 'image/png'): File {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type });
}

describe('appendScreenshotsFromFiles', () => {
  it('adiciona imagens válidas até o limite', async () => {
    const files = [makeImageFile('a.png', 100), makeImageFile('b.png', 200)];
    const { screenshots, added } = await appendScreenshotsFromFiles(files, []);
    expect(added).toBe(2);
    expect(screenshots).toHaveLength(2);
    expect(screenshots[0].name).toBe('a.png');
    expect(screenshots[0].dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('rejeita arquivo maior que 2MB', async () => {
    const big = makeImageFile('big.png', 2 * 1024 * 1024 + 1);
    const { screenshots, added, rejected } = await appendScreenshotsFromFiles([big], []);
    expect(added).toBe(0);
    expect(rejected).toBe(1);
    expect(screenshots).toHaveLength(0);
  });

  it(`respeita limite de ${MAX_BUSINESS_RULE_SCREENSHOTS} imagens`, async () => {
    const existing = Array.from({ length: MAX_BUSINESS_RULE_SCREENSHOTS }, (_, i) => ({
      id: `id-${i}`,
      name: `s${i}.png`,
      dataUrl: 'data:image/png;base64,AA==',
      uploadedAt: '2020-01-01T00:00:00.000Z',
    }));
    const files = [makeImageFile('extra.png', 50)];
    const { screenshots, added } = await appendScreenshotsFromFiles(files, existing);
    expect(added).toBe(0);
    expect(screenshots).toHaveLength(MAX_BUSINESS_RULE_SCREENSHOTS);
  });
});
