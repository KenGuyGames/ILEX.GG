const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const asset=path.join(root,'work/desktop/ui/ilex-card-back.svg'),data=fs.readFileSync(path.join(root,'work/triumphant-sleeve-reference.jpg'));
fs.copyFileSync(asset,path.join(root,'work/ilex-card-back-before-triumphant.svg'));
fs.writeFileSync(asset,`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="250" viewBox="0 0 357 500"><title>Triumphant prerelease Celebi sleeve</title><image width="357" height="500" href="data:image/jpeg;base64,${data.toString('base64')}"/></svg>\n`);
fs.copyFileSync(asset,path.join(root,'work/dp-desktop-candidate/resources/app/ui/ilex-card-back.svg'));
fs.writeFileSync(path.join(root,'work/desktop/ui/CARD-BACK-SOURCE.md'),'# Card back artwork\n\nHS—Triumphant prerelease sleeve featuring Celebi. Original 357 × 500 image embedded unchanged in the shared SVG wrapper for offline rendering.\n\nSource: https://archives.bulbagarden.net/wiki/File:HS4_Prerelease_Sleeve.jpg\nImage: https://archives.bulbagarden.net/media/upload/d/d4/HS4_Prerelease_Sleeve.jpg\nRetrieved October 18, 2026. Pokémon artwork and marks belong to their respective owners.\n');
fs.copyFileSync(path.join(root,'work/desktop/ui/CARD-BACK-SOURCE.md'),path.join(root,'work/dp-desktop-candidate/resources/app/ui/CARD-BACK-SOURCE.md'));
