(function () {
  var input = document.getElementById('search-query');
  var results = document.getElementById('search-results');
  var count = document.getElementById('search-count');

  if (!input || !results || !count) {
    return;
  }

  function postLink(post) {
    return '<a href="' + post.url + '" title="' + post.title + '">' + post.title + '</a>';
  }

  function render(posts, query) {
    if (!query) {
      results.innerHTML = '';
      count.textContent = 'Type to search all posts.';
      return;
    }

    count.textContent = posts.length + (posts.length === 1 ? ' result' : ' results');

    if (!posts.length) {
      results.innerHTML = '<p>No posts found.</p>';
      return;
    }

    results.innerHTML = posts.map(function (post) {
      var tags = post.tags.concat(post.categories).map(function (tag) {
        return '<span class="t-hackcss-post-tag">' + tag + '</span>';
      }).join(' ');

      return [
        '<div class="media t-hackcss-media">',
          '<div class="media-body">',
            '<div class="media-heading"><span>' + post.date + ' &raquo; ' + postLink(post) + '</span></div>',
            '<div class="media-content">' + post.description + '</div>',
            '<div class="t-hackcss-post-tags">' + tags + '</div>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  function matches(post, query) {
    var haystack = [
      post.title,
      post.description,
      post.content,
      post.categories.join(' '),
      post.tags.join(' ')
    ].join(' ').toLowerCase();

    return haystack.indexOf(query) !== -1;
  }

  fetch(window.searchDataUrl || '/search.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (posts) {
      render([], '');

      input.addEventListener('input', function () {
        var query = input.value.trim().toLowerCase();
        render(posts.filter(function (post) {
          return matches(post, query);
        }), query);
      });
    })
    .catch(function () {
      count.textContent = 'Search data could not be loaded.';
    });
})();
