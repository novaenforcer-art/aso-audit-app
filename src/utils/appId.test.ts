import { extractAppId } from './appId.ts';

const urls = [
  "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580",
  "https://apps.apple.com/gb/app/some-app/id123456789",
  "https://apps.apple.com/app/id987654321",
  "https://apps.apple.com/us/app/id444444444?pt=123",
  "itunes.apple.com/app/id555555555",
  "invalid-url"
];

urls.forEach(url => {
  console.log(`URL: ${url} -> ID: ${extractAppId(url)}`);
});
