var bg = "data:image/png;base64,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";
module.exports = { bg };