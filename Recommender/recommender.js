const loadModule = async () => {
    const { default: generateVideoArray } = await import('./recommender.mjs');
    return generateVideoArray;
}

module.exports = (...args) => {
    return loadModule().then((generateVideoArray) => {
        return generateVideoArray(...args);
    });
}