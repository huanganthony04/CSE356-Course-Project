const loadModule = async () => {
    const { generateVideoArray, generateVideoArrayVideoBased } = await import('./recommender.mjs');
    return { generateVideoArray, generateVideoArrayVideoBased };
}

module.exports = (username, videoId, count) => {
    return loadModule().then(({ generateVideoArray, generateVideoArrayVideoBased }) => {
        if (videoId) {
            return generateVideoArrayVideoBased(username, videoId, count);
        }
        else {
            return generateVideoArray(username);
        }
    });
}