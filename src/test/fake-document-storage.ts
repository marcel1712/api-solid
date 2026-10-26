import { DocumentStorage } from "@/lib/document-storage";

/** R2 stand-in: `objects` maps each stored key to its size in bytes. */
export class FakeDocumentStorage implements DocumentStorage {
  public objects = new Map<string, number>();

  async createUploadUrl(key: string) {
    return `https://r2.test/${key}?signed`;
  }

  async sizeOf(key: string) {
    return this.objects.get(key) ?? null;
  }

  async createDownloadUrl(key: string) {
    return `https://r2.test/${key}?download`;
  }

  async delete(key: string) {
    this.objects.delete(key);
  }
}
