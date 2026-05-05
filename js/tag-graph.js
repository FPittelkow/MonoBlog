(function () {
  var graph = document.querySelector('[data-tag-graph]');
  var svg = graph && graph.querySelector('svg');
  var insight = document.querySelector('[data-tag-insight]');
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
  var selectedTagId = null;

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
  var tagConnections = [];
  var tagLookup = tagNodes.reduce(function (lookup, tag) {
    lookup[tag.name] = tag;
    return lookup;
  }, {});
  var tagIdLookup = tagNodes.reduce(function (lookup, tag) {
    lookup[tag.id] = tag;
    return lookup;
  }, {});

  tagNodes.forEach(function (left, leftIndex) {
    tagNodes.slice(leftIndex + 1).forEach(function (right) {
      var sharedPosts = postNodes.filter(function (post) {
        return post.tags.indexOf(left.name) !== -1 && post.tags.indexOf(right.name) !== -1;
      });

      if (!sharedPosts.length) {
        return;
      }

      tagConnections.push({
        left: left,
        right: right,
        sharedPosts: sharedPosts,
        path: create('path', {
          d: [
            'M', left.x - 122, left.y,
            'C', left.x - 178, left.y,
            right.x - 178, right.y,
            right.x - 122, right.y
          ].join(' '),
          class: 't-hackcss-tag-graph-tag-edge',
          'data-left-tag': left.id,
          'data-right-tag': right.id
        })
      });
    });
  });

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

  tagConnections.forEach(function (connection) {
    svg.appendChild(connection.path);
  });

  edges.forEach(function (edge) {
    svg.appendChild(edge.path);
  });

  tagNodes.forEach(function (tag) {
    var link = create('a', { href: '#tag-' + slug(tag.name) });
    link.setAttribute('class', 't-hackcss-tag-graph-link');
    link.setAttribute('data-tag', tag.id);
    link.setAttribute('aria-pressed', 'false');
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

    tagConnections.forEach(function (connection) {
      var active = false;

      if (tagId) {
        active = connection.left.id === tagId || connection.right.id === tagId;
      } else if (postId) {
        active = connection.sharedPosts.some(function (post) {
          return post.id === postId;
        });
      }

      connection.path.classList.toggle('is-active', active);
      connection.path.classList.toggle('is-muted', !active);

      if (active) {
        activeTags[connection.left.id] = true;
        activeTags[connection.right.id] = true;
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

  function applySelection() {
    if (selectedTagId) {
      setActive(selectedTagId);
    } else {
      clearActive();
    }

    svg.querySelectorAll('.t-hackcss-tag-graph-link[data-tag]').forEach(function (node) {
      node.setAttribute('aria-pressed', String(node.getAttribute('data-tag') === selectedTagId));
    });

    svg.querySelectorAll('.t-hackcss-tag-graph-tag').forEach(function (node) {
      node.classList.toggle('is-selected', node.getAttribute('data-tag') === selectedTagId);
    });

    renderInsight();
  }

  function selectTag(tagId) {
    selectedTagId = selectedTagId === tagId ? null : tagId;
    applySelection();
  }

  function selectTagFromHash() {
    var hash = window.location.hash.replace(/^#/, '');
    var matchingTag = tagNodes.filter(function (tag) {
      return tag.id === hash;
    })[0];

    selectedTagId = matchingTag ? matchingTag.id : null;
    applySelection();
  }

  function createElement(name, className, text) {
    var node = document.createElement(name);

    if (className) {
      node.className = className;
    }

    if (text) {
      node.textContent = text;
    }

    return node;
  }

  function postsForTag(tagName) {
    return postNodes.filter(function (post) {
      return post.tags.indexOf(tagName) !== -1;
    });
  }

  function relatedTagsForTag(tagId) {
    return tagConnections.filter(function (connection) {
      return connection.left.id === tagId || connection.right.id === tagId;
    }).map(function (connection) {
      var related = connection.left.id === tagId ? connection.right : connection.left;

      return {
        tag: related,
        count: connection.sharedPosts.length
      };
    }).sort(function (left, right) {
      return right.count - left.count || left.tag.name.localeCompare(right.tag.name);
    });
  }

  function renderPostList(posts) {
    var list = createElement('ol', 't-hackcss-tag-insight-posts');

    posts.forEach(function (post) {
      var item = createElement('li');
      var link = createElement('a', null, post.title);
      link.href = post.url;
      item.appendChild(link);
      list.appendChild(item);
    });

    return list;
  }

  function renderRelatedTags(relatedTags) {
    var list = createElement('ul', 't-hackcss-tag-insight-tags');

    relatedTags.forEach(function (related) {
      var item = createElement('li');
      var link = createElement('a', null, related.tag.name);
      var count = createElement('span', null, String(related.count));

      link.href = '#tag-' + slug(related.tag.name);
      item.appendChild(link);
      item.appendChild(count);
      list.appendChild(item);
    });

    return list;
  }

  function renderInsight() {
    if (!insight) {
      return;
    }

    insight.innerHTML = '';

    if (!selectedTagId) {
      var totalPosts = postNodes.length;
      var heading = createElement('h2', null, 'Tag insights');
      var summary = createElement(
        'p',
        't-hackcss-tag-insight-summary',
        tagNodes.length + ' tags across ' + totalPosts + ' tagged ' + (totalPosts === 1 ? 'post' : 'posts') + '.'
      );
      var topTags = tagNodes.slice(0, 6).map(function (tag) {
        return {
          tag: tag,
          count: tag.count
        };
      });

      // insight.appendChild(heading);
      insight.appendChild(summary);
      insight.appendChild(renderRelatedTags(topTags));
      return;
    }

    var tag = tagIdLookup[selectedTagId];
    var posts = tag ? postsForTag(tag.name) : [];
    var relatedTags = relatedTagsForTag(selectedTagId);
    var tagHeading = createElement('h2', null, tag ? tag.name : 'Tag insights');
    var tagSummary = createElement(
      'p',
      't-hackcss-tag-insight-summary',
      posts.length + ' associated ' + (posts.length === 1 ? 'post' : 'posts') +
      (relatedTags.length ? ' and ' + relatedTags.length + ' connected ' + (relatedTags.length === 1 ? 'tag' : 'tags') + '.' : '.')
    );

    insight.appendChild(tagHeading);
    // insight.appendChild(tagSummary);

    if (relatedTags.length) {
      insight.appendChild(renderRelatedTags(relatedTags));
    }

    if (posts.length) {
      insight.appendChild(renderPostList(posts));
    }
  }

  svg.querySelectorAll('.t-hackcss-tag-graph-link').forEach(function (node) {
    node.addEventListener('mouseenter', function () {
      setActive(node.getAttribute('data-tag'), node.getAttribute('data-post'));
    });
    node.addEventListener('mouseleave', applySelection);
    node.addEventListener('focus', function () {
      setActive(node.getAttribute('data-tag'), node.getAttribute('data-post'));
    });
    node.addEventListener('blur', applySelection);
    node.addEventListener('click', function (event) {
      var tagId = node.getAttribute('data-tag');

      if (!tagId) {
        return;
      }

      event.preventDefault();
      selectTag(tagId);

      if (selectedTagId) {
        window.location.hash = tagId;
      } else if (window.location.hash) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    });
  });

  window.addEventListener('hashchange', selectTagFromHash);
  selectTagFromHash();
})();
