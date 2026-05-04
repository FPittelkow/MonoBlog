(function () {
  var graph = document.querySelector('[data-tag-graph]');
  var svg = graph && graph.querySelector('svg');
  var stats = graph && graph.querySelector('[data-tag-graph-stats]');
  var status = graph && graph.querySelector('[data-tag-graph-status]');
  var clearButton = graph && graph.querySelector('[data-tag-graph-clear]');
  var detailTitle = graph && graph.querySelector('[data-tag-graph-detail-title]');
  var detailSummary = graph && graph.querySelector('[data-tag-graph-detail-summary]');
  var relatedList = graph && graph.querySelector('[data-tag-graph-related]');
  var postList = graph && graph.querySelector('[data-tag-graph-posts]');
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
  var pinned = null;

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

  function plural(count, singular, pluralValue) {
    return count + ' ' + (count === 1 ? singular : pluralValue);
  }

  var edges = [];
  var tagRelations = [];
  var tagLookup = tagNodes.reduce(function (lookup, tag) {
    lookup[tag.name] = tag;
    return lookup;
  }, {});
  var tagById = tagNodes.reduce(function (lookup, tag) {
    lookup[tag.id] = tag;
    return lookup;
  }, {});
  var postById = postNodes.reduce(function (lookup, post) {
    lookup[post.id] = post;
    return lookup;
  }, {});
  var relationLookup = {};

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

    post.tags.forEach(function (tagName, index) {
      post.tags.slice(index + 1).forEach(function (otherName) {
        var tag = tagLookup[tagName];
        var otherTag = tagLookup[otherName];
        var key;

        if (!tag || !otherTag) {
          return;
        }

        key = [tag.id, otherTag.id].sort().join('__');
        if (!relationLookup[key]) {
          relationLookup[key] = {
            tags: [tag, otherTag],
            posts: [],
            path: create('path', {
              d: [
                'M', tag.x - 118, tag.y,
                'C', tag.x - 178, tag.y,
                otherTag.x - 178, otherTag.y,
                otherTag.x - 118, otherTag.y
              ].join(' '),
              class: 't-hackcss-tag-graph-relation',
              'data-relation': key
            })
          };
          tagRelations.push(relationLookup[key]);
        }

        relationLookup[key].posts.push(post);
      });
    });
  });

  svg.appendChild(label('tags', 78, 26, 't-hackcss-tag-graph-axis-label', 'start'));
  svg.appendChild(label('posts', 540, 26, 't-hackcss-tag-graph-axis-label', 'start'));

  tagRelations.forEach(function (relation) {
    svg.appendChild(relation.path);
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

  if (stats) {
    stats.textContent = [
      plural(tagNodes.length, 'tag', 'tags'),
      plural(postNodes.length, 'post', 'posts'),
      plural(edges.length, 'connection', 'connections'),
      plural(tagRelations.length, 'co-tag', 'co-tags')
    ].join(' / ');
  }

  function renderItems(container, items, renderItem) {
    if (!container) {
      return;
    }

    container.innerHTML = '';
    if (!items.length) {
      var empty = document.createElement('span');
      empty.className = 't-hackcss-tag-graph-empty';
      empty.textContent = 'None yet';
      container.appendChild(empty);
      return;
    }

    items.forEach(function (item) {
      container.appendChild(renderItem(item));
    });
  }

  function renderTagPill(tag) {
    var link = document.createElement('a');
    link.href = '#tag-' + slug(tag.name);
    link.className = 't-hackcss-tag-graph-pill';
    link.textContent = tag.name + ' (' + tag.count + ')';
    link.setAttribute('data-tag-id', tag.id);
    link.addEventListener('click', function (event) {
      event.preventDefault();
      setActive(tag.id, null, true);
    });
    return link;
  }

  function renderPostLink(post) {
    var link = document.createElement('a');
    link.href = post.url;
    link.className = 't-hackcss-tag-graph-post-link';
    link.textContent = post.title;
    link.setAttribute('data-post-id', post.id);
    link.addEventListener('click', function (event) {
      event.preventDefault();
      setActive(null, post.id, true);
    });
    return link;
  }

  function getPostsForTag(tagId) {
    return postNodes.filter(function (post) {
      return post.tags.some(function (tagName) {
        var tag = tagLookup[tagName];
        return tag && tag.id === tagId;
      });
    });
  }

  function getRelatedTags(tagId) {
    var related = {};

    tagRelations.forEach(function (relation) {
      var left = relation.tags[0];
      var right = relation.tags[1];

      if (left.id === tagId) {
        related[right.id] = right;
      }
      if (right.id === tagId) {
        related[left.id] = left;
      }
    });

    return Object.keys(related).map(function (id) {
      return related[id];
    }).sort(function (left, right) {
      return right.count - left.count || left.name.localeCompare(right.name);
    });
  }

  function getTagsForPost(post) {
    return post.tags.map(function (tagName) {
      return tagLookup[tagName];
    }).filter(Boolean);
  }

  function renderDetails(tagId, postId, activeTags, activePosts) {
    var tag = tagId && tagById[tagId];
    var post = postId && postById[postId];
    var posts;
    var relatedTags;

    if (!detailTitle || !detailSummary) {
      return;
    }

    if (tag) {
      posts = getPostsForTag(tag.id);
      relatedTags = getRelatedTags(tag.id);
      detailTitle.textContent = tag.name;
      detailSummary.textContent = [
        plural(posts.length, 'post', 'posts'),
        relatedTags.length ? plural(relatedTags.length, 'related tag', 'related tags') : 'no co-tags yet'
      ].join(' / ');
      renderItems(relatedList, relatedTags, renderTagPill);
      renderItems(postList, posts, renderPostLink);
      return;
    }

    if (post) {
      relatedTags = getTagsForPost(post);
      detailTitle.textContent = post.title;
      detailSummary.textContent = 'This post carries ' + plural(relatedTags.length, 'tag', 'tags') + '.';
      renderItems(relatedList, relatedTags, renderTagPill);
      renderItems(postList, [post], renderPostLink);
      return;
    }

    detailTitle.textContent = 'All tags';
    detailSummary.textContent = [
      plural(Object.keys(activeTags || {}).length || tagNodes.length, 'visible tag', 'visible tags'),
      plural(Object.keys(activePosts || {}).length || postNodes.length, 'visible post', 'visible posts')
    ].join(' / ');
    renderItems(relatedList, tagNodes, renderTagPill);
    renderItems(postList, postNodes, renderPostLink);
  }

  function describeActive(tagId, postId, activeTags, activePosts) {
    if (!status) {
      return;
    }

    if (tagId) {
      var tag = tagNodes.find(function (node) {
        return node.id === tagId;
      });
      status.textContent = tag ? tag.name + ' links to ' + plural(Object.keys(activePosts).length, 'post', 'posts') : 'All connections';
      return;
    }

    if (postId) {
      var post = postNodes.find(function (node) {
        return node.id === postId;
      });
      status.textContent = post ? post.title + ' uses ' + plural(Object.keys(activeTags).length, 'tag', 'tags') : 'All connections';
      return;
    }

    status.textContent = 'All connections';
  }

  function setActive(tagId, postId, shouldPin) {
    var activeTags = {};
    var activePosts = {};

    if (shouldPin) {
      pinned = tagId || postId ? { tagId: tagId, postId: postId } : null;
      graph.classList.toggle('is-pinned', Boolean(pinned));
    }

    edges.forEach(function (edge) {
      var active = (!tagId || edge.tag.id === tagId) && (!postId || edge.post.id === postId);
      edge.path.classList.toggle('is-active', active);
      edge.path.classList.toggle('is-muted', !active);

      if (active) {
        activeTags[edge.tag.id] = true;
        activePosts[edge.post.id] = true;
      }
    });

    tagRelations.forEach(function (relation) {
      var active = tagId && (relation.tags[0].id === tagId || relation.tags[1].id === tagId);
      var postActive = postId && relation.posts.some(function (post) {
        return post.id === postId;
      });

      relation.path.classList.toggle('is-active', Boolean(active || postActive));
      relation.path.classList.toggle('is-muted', Boolean((tagId || postId) && !active && !postActive));

      if (active) {
        activeTags[relation.tags[0].id] = true;
        activeTags[relation.tags[1].id] = true;
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

    describeActive(tagId, postId, activeTags, activePosts);
    renderDetails(tagId, postId, activeTags, activePosts);
  }

  function clearActive(force) {
    if (pinned && !force) {
      setActive(pinned.tagId, pinned.postId, false);
      return;
    }

    pinned = null;
    graph.classList.remove('is-pinned');
    svg.querySelectorAll('.is-active, .is-muted').forEach(function (node) {
      node.classList.remove('is-active');
      node.classList.remove('is-muted');
    });
    if (status) {
      status.textContent = 'All connections';
    }
    renderDetails(null, null);
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
    node.addEventListener('click', function (event) {
      var tagId = node.getAttribute('data-tag');
      var postId = node.getAttribute('data-post');

      if (tagId) {
        event.preventDefault();
      }

      setActive(tagId, postId, true);
    });
  });

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      clearActive(true);
    });
  }

  renderDetails(null, null);
})();
