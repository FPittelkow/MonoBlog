(function () {
  var graph = document.querySelector('[data-tag-graph]');
  var svg = graph && graph.querySelector('svg');
  var data = window.tagGraphData;

  if (!graph || !svg || !data || !data.tags.length) {
    return;
  }

  var width = 860;
  var tagGap = 58;
  var postGap = 78;
  var topPadding = 54;
  var bottomPadding = 54;
  var ns = 'http://www.w3.org/2000/svg';

  var tagNodes = data.tags.slice().sort(function (left, right) {
    return right.count - left.count || left.name.localeCompare(right.name);
  }).map(function (tag, index) {
    return {
      id: 'tag-' + slug(tag.name),
      name: tag.name,
      count: tag.count,
      x: 190,
      y: topPadding + index * tagGap
    };
  });

  var postNodes = data.posts.filter(function (post) {
    return post.tags && post.tags.length;
  }).map(function (post, index) {
    return {
      id: 'post-' + index,
      title: post.title,
      url: post.url,
      tags: post.tags,
      x: 660,
      y: topPadding + index * postGap
    };
  });

  var height = Math.max(
    300,
    topPadding + bottomPadding + Math.max((tagNodes.length - 1) * tagGap, (postNodes.length - 1) * postGap)
  );

  svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  svg.innerHTML = '<title id="tag-graph-title">Post tag graph</title>';

  function create(name, attrs) {
    var node = document.createElementNS(ns, name);
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function label(text, x, y, className, anchor) {
    var node = create('text', {
      x: x,
      y: y,
      'text-anchor': anchor || 'middle',
      class: className
    });
    node.textContent = text;
    return node;
  }

  function shortTitle(title) {
    return title.length > 34 ? title.slice(0, 31) + '...' : title;
  }

  var edges = [];
  var tagLookup = tagNodes.reduce(function (lookup, tag) {
    lookup[tag.name] = tag;
    return lookup;
  }, {});

  postNodes.forEach(function (post) {
    post.tags.forEach(function (tagName) {
      var tag = tagLookup[tagName];
      if (!tag) {
        return;
      }

      edges.push({
        tag: tag,
        post: post,
        path: create('path', {
          d: [
            'M', tag.x + 112, tag.y,
            'C', tag.x + 250, tag.y,
            post.x - 250, post.y,
            post.x - 120, post.y
          ].join(' '),
          class: 't-hackcss-tag-graph-edge',
          'data-tag': tag.id,
          'data-post': post.id
        })
      });
    });
  });

  edges.forEach(function (edge) {
    svg.appendChild(edge.path);
  });

  tagNodes.forEach(function (tag) {
    var link = create('a', { href: '#tag-' + slug(tag.name) });
    link.setAttribute('class', 't-hackcss-tag-graph-link');
    link.setAttribute('data-tag', tag.id);
    link.appendChild(create('rect', {
      x: tag.x - 112,
      y: tag.y - 18,
      width: 224,
      height: 36,
      rx: 2,
      class: 't-hackcss-tag-graph-tag',
      'data-tag': tag.id
    }));
    link.appendChild(label(tag.name, tag.x - 92, tag.y + 5, 't-hackcss-tag-graph-label', 'start'));
    link.appendChild(label(String(tag.count), tag.x + 92, tag.y + 5, 't-hackcss-tag-graph-count', 'end'));
    svg.appendChild(link);
  });

  postNodes.forEach(function (post) {
    var link = create('a', { href: post.url });
    link.setAttribute('class', 't-hackcss-tag-graph-link');
    link.setAttribute('data-post', post.id);
    link.appendChild(create('rect', {
      x: post.x - 120,
      y: post.y - 22,
      width: 240,
      height: 44,
      rx: 2,
      class: 't-hackcss-tag-graph-post',
      'data-post': post.id
    }));
    link.appendChild(label(shortTitle(post.title), post.x, post.y + 5, 't-hackcss-tag-graph-post-label'));
    svg.appendChild(link);
  });

  function setActive(tagId, postId) {
    var activeTags = {};
    var activePosts = {};

    edges.forEach(function (edge) {
      var active = (!tagId || edge.tag.id === tagId) && (!postId || edge.post.id === postId);
      edge.path.classList.toggle('is-active', active);
      edge.path.classList.toggle('is-muted', !active);

      if (active) {
        activeTags[edge.tag.id] = true;
        activePosts[edge.post.id] = true;
      }
    });

    svg.querySelectorAll('.t-hackcss-tag-graph-tag').forEach(function (node) {
      var id = node.getAttribute('data-tag');
      node.classList.toggle('is-active', Boolean(activeTags[id]));
      node.classList.toggle('is-muted', !activeTags[id]);
    });

    svg.querySelectorAll('.t-hackcss-tag-graph-post').forEach(function (node) {
      var id = node.getAttribute('data-post');
      node.classList.toggle('is-active', Boolean(activePosts[id]));
      node.classList.toggle('is-muted', !activePosts[id]);
    });
  }

  function clearActive() {
    svg.querySelectorAll('.is-active, .is-muted').forEach(function (node) {
      node.classList.remove('is-active');
      node.classList.remove('is-muted');
    });
  }

  svg.querySelectorAll('.t-hackcss-tag-graph-link').forEach(function (node) {
    node.addEventListener('mouseenter', function () {
      setActive(node.getAttribute('data-tag'), node.getAttribute('data-post'));
    });
    node.addEventListener('mouseleave', clearActive);
    node.addEventListener('focus', function () {
      setActive(node.getAttribute('data-tag'), node.getAttribute('data-post'));
    });
    node.addEventListener('blur', clearActive);
  });
})();
