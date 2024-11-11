const loadModule = async () => {
    const { default: generateVideoStack } = await import('./recommender.mjs');
    return generateVideoStack;
}

module.exports = (...args) => {
    return loadModule().then((generateVideoStack) => {
        return generateVideoStack(...args);
    });
}