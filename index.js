module.exports = function(url) {
	if (!/^(https|http):\/\//.test(url))
		return 'http://' + url;

	return url;
}