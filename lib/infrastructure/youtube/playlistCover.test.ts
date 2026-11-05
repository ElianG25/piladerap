import { describe, it, expect } from "vitest";
import { extractOgImage, playlistIdFromUrl } from "./playlistCover";

describe("playlistIdFromUrl", () => {
  it("lee el id de la playlist", () => {
    expect(playlistIdFromUrl("https://youtube.com/playlist?list=PLZ0AwexESsHY&si=abc")).toBe("PLZ0AwexESsHY");
  });
  it("devuelve null si no es una URL con list", () => {
    expect(playlistIdFromUrl("FECHA 2 - YouTube")).toBeNull();
    expect(playlistIdFromUrl("https://youtube.com/watch?v=x")).toBeNull();
  });
});

describe("extractOgImage", () => {
  it("extrae y decodifica la portada de YouTube", () => {
    const html = '<head><meta property="og:image" content="https://i.ytimg.com/pl_c/PL1/studio_square_thumbnail.jpg?sqp=A&amp;rs=B"></head>';
    expect(extractOgImage(html)).toBe("https://i.ytimg.com/pl_c/PL1/studio_square_thumbnail.jpg?sqp=A&rs=B");
  });
  it("ignora imágenes que no son de YouTube", () => {
    expect(extractOgImage('<meta property="og:image" content="https://evil.example/x.jpg">')).toBeNull();
  });
});
