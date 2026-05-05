(function () {
  var graph = document.querySelector('[data-tag-graph]');
  var svg = graph && graph.querySelector('svg');
  var insight = document.querySelector('[data-tag-insight]');
  var data = window.tagGraphData;

  if (!graph || !svg || !data || !data.tags.length) {
    return;
  }

  var isMobileGraph = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  var width = isMobileGraph ? 320 : 860;
  var tagGap = isMobileGraph ? 44 : 58;
  var postGap = 78;
  var topPadding = isMobileGraph ? 28 : 54;
  var bottomPadding = isMobileGraph ? 28 : 54;
  var ns = 'http://www.w3.org/2000/svg';
  var selectedTagIds = [];
  var mobileTagList = null;

  var tagNodes = data.tags.slice().sort(function (left, right) {
    return right.count - left.count || left.name.localeCompare(right.name);
  }).map(function (tag, index) {
    return {
      id: 'tag-' + slug(tag.name),
      name: tag.name,
      count: tag.count,
      x: isMobileGraph ? 160 : 190,
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
      categories: post.categories || [],
      tags: post.tags,
      x: 660,
      y: topPadding + index * postGap
    };
  });

  var height = isMobileGraph ?
    Math.max(220, topPadding + bottomPadding + Math.max(0, (tagNodes.length - 1) * tagGap)) :
    Math.max(
      300,
      topPadding + bottomPadding + Math.max((tagNodes.length - 1) * tagGap, (postNodes.length - 1) * postGap)
    );

  svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  svg.innerHTML = '<title id="tag-graph-title">Post tag graph</title>';
  graph.classList.toggle('is-mobile-tag-list', isMobileGraph);

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

  if (isMobileGraph) {
    renderMobileTagList();
  } else {
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
  }

  function includes(list, value) {
    return list.indexOf(value) !== -1;
  }

  function selectedTags() {
    return selectedTagIds.map(function (tagId) {
      return tagIdLookup[tagId];
    }).filter(Boolean);
  }

  function selectedTagNames() {
    return selectedTags().map(function (tag) {
      return tag.name;
    });
  }

  function postMatchesTags(post, tagNames) {
    return tagNames.every(function (tagName) {
      return includes(post.tags, tagName);
    });
  }

  function postsForTags(tagNames) {
    if (!tagNames.length) {
      return postNodes;
    }

    return postNodes.filter(function (post) {
      return postMatchesTags(post, tagNames);
    });
  }

  function setActive(tagIds, postId) {
    tagIds = tagIds || [];

    var activeTags = {};
    var activePosts = {};
    var activePostIds = {};
    var filterTagNames = tagIds.map(function (tagId) {
      return tagIdLookup[tagId] && tagIdLookup[tagId].name;
    }).filter(Boolean);
    var matchingPosts = postsForTags(filterTagNames);

    matchingPosts.forEach(function (post) {
      activePostIds[post.id] = true;
    });
    tagIds.forEach(function (tagId) {
      activeTags[tagId] = true;
    });

    edges.forEach(function (edge) {
      var active = (!tagIds.length || includes(tagIds, edge.tag.id)) &&
        (!tagIds.length || activePostIds[edge.post.id]) &&
        (!postId || edge.post.id === postId);

      edge.path.classList.toggle('is-active', active);
      edge.path.classList.toggle('is-muted', !active);

      if (active) {
        activeTags[edge.tag.id] = true;
        activePosts[edge.post.id] = true;
      }
    });

    tagConnections.forEach(function (connection) {
      var active = false;

      if (tagIds.length) {
        active = (includes(tagIds, connection.left.id) || includes(tagIds, connection.right.id)) &&
          (!postId || connection.sharedPosts.some(function (post) {
            return post.id === postId;
          }));

        if (tagIds.length > 1) {
          active = active && tagIds.every(function (tagId) {
            return connection.left.id === tagId || connection.right.id === tagId ||
              connection.sharedPosts.some(function (post) {
                return tagIdLookup[tagId] && includes(post.tags, tagIdLookup[tagId].name);
              });
          });
        }
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
    if (selectedTagIds.length) {
      setActive(selectedTagIds);
    } else {
      clearActive();
    }

    svg.querySelectorAll('.t-hackcss-tag-graph-link[data-tag]').forEach(function (node) {
      node.setAttribute('aria-pressed', String(includes(selectedTagIds, node.getAttribute('data-tag'))));
    });

    svg.querySelectorAll('.t-hackcss-tag-graph-tag').forEach(function (node) {
      node.classList.toggle('is-selected', includes(selectedTagIds, node.getAttribute('data-tag')));
    });

    graph.querySelectorAll('.t-hackcss-tag-filter').forEach(function (node) {
      var selected = includes(selectedTagIds, node.getAttribute('data-tag'));
      node.classList.toggle('is-selected', selected);
      node.setAttribute('aria-pressed', String(selected));
    });

    renderInsight();
  }

  function selectTag(tagId) {
    if (includes(selectedTagIds, tagId)) {
      selectedTagIds = selectedTagIds.filter(function (selectedTagId) {
        return selectedTagId !== tagId;
      });
    } else {
      selectedTagIds = selectedTagIds.concat(tagId);
    }

    applySelection();
  }

  function selectTagFromHash() {
    var hash = window.location.hash.replace(/^#/, '');
    var hashTags = hash.split(',').filter(Boolean);

    selectedTagIds = hashTags.filter(function (tagId) {
      return Boolean(tagIdLookup[tagId]);
    });

    applySelection();
  }

  function updateHash() {
    if (selectedTagIds.length) {
      window.location.hash = selectedTagIds.join(',');
    } else if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
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

  function renderMobileTagList() {
    mobileTagList = createElement('div', 't-hackcss-tag-filter-list');

    tagNodes.forEach(function (tag) {
      var button = createElement('button', 't-hackcss-tag-filter');
      var count = createElement('span', null, String(tag.count));

      button.type = 'button';
      button.setAttribute('data-tag', tag.id);
      button.setAttribute('aria-pressed', 'false');
      button.appendChild(document.createTextNode(tag.name));
      button.appendChild(count);
      button.addEventListener('click', function () {
        selectTag(tag.id);
        updateHash();
      });

      mobileTagList.appendChild(button);
    });

    graph.appendChild(mobileTagList);
  }

  function countCategories(posts) {
    var categories = {};

    posts.forEach(function (post) {
      post.categories.forEach(function (category) {
        categories[category] = (categories[category] || 0) + 1;
      });
    });

    return Object.keys(categories).sort(function (left, right) {
      return categories[right] - categories[left] || left.localeCompare(right);
    }).map(function (category) {
      return {
        name: category,
        count: categories[category]
      };
    });
  }

  function relatedTagsForSelection(posts, selectedNames) {
    var related = {};

    posts.forEach(function (post) {
      post.tags.forEach(function (tagName) {
        if (includes(selectedNames, tagName)) {
          return;
        }

        related[tagName] = (related[tagName] || 0) + 1;
      });
    });

    if (!Object.keys(related).length && selectedTagIds.length) {
      tagConnections.forEach(function (connection) {
        [connection.left, connection.right].forEach(function (tag) {
          if (!includes(selectedTagIds, tag.id)) {
            return;
          }

          var other = connection.left.id === tag.id ? connection.right : connection.left;
          if (!includes(selectedNames, other.name)) {
            related[other.name] = Math.max(related[other.name] || 0, connection.sharedPosts.length);
          }
        });
      });
    }

    return Object.keys(related).map(function (tagName) {
      return {
        tag: tagLookup[tagName],
        count: related[tagName]
      };
    }).filter(function (relatedTag) {
      return relatedTag.tag;
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

  function renderRelatedTags(relatedTags, baseTagIds) {
    var list = createElement('ul', 't-hackcss-tag-insight-tags');
    baseTagIds = baseTagIds || [];

    relatedTags.forEach(function (related) {
      var item = createElement('li');
      var link = createElement('a', null, related.tag.name);
      var count = createElement('span', null, String(related.count));

      link.href = '#' + baseTagIds.concat(related.tag.id).join(',');
      item.appendChild(link);
      item.appendChild(count);
      list.appendChild(item);
    });

    return list;
  }

  function renderCategories(categories) {
    var list = createElement('ul', 't-hackcss-tag-insight-tags t-hackcss-tag-insight-categories');

    categories.forEach(function (category) {
      var item = createElement('li');
      var count = createElement('span', null, String(category.count));

      item.appendChild(document.createTextNode(category.name));
      item.appendChild(count);
      list.appendChild(item);
    });

    return list;
  }

  function renderSection(title, content) {
    var section = createElement('section', 't-hackcss-tag-insight-section');
    section.appendChild(createElement('h3', null, title));
    section.appendChild(content);
    return section;
  }

  function renderInsight() {
    if (!insight) {
      return;
    }

    insight.innerHTML = '';

    if (!selectedTagIds.length) {
      var totalPosts = postNodes.length;
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

      insight.appendChild(summary);
      insight.appendChild(renderSection('Frequent tags', renderRelatedTags(topTags)));
      insight.appendChild(renderSection('Categories', renderCategories(countCategories(postNodes))));
      return;
    }

    var selectedNames = selectedTagNames();
    var posts = postsForTags(selectedNames);
    var relatedTags = relatedTagsForSelection(posts, selectedNames);
    var selectedHeading = createElement('h2', null, selectedNames.join(' + '));
    var selectedSummary = createElement(
      'p',
      't-hackcss-tag-insight-summary',
      selectedNames.length + ' selected ' + (selectedNames.length === 1 ? 'tag' : 'tags') +
      ' match ' + posts.length + ' ' + (posts.length === 1 ? 'post' : 'posts') + '.'
    );

    insight.appendChild(selectedHeading);
    insight.appendChild(selectedSummary);

    // if (posts.length) {
    //   insight.appendChild(renderSection('Categories', renderCategories(countCategories(posts))));
    // }

    if (relatedTags.length) {
      insight.appendChild(renderSection('Related tags', renderRelatedTags(relatedTags, selectedTagIds)));
    }

    if (posts.length) {
      insight.appendChild(renderSection('Posts', renderPostList(posts)));
    }
  }

  svg.querySelectorAll('.t-hackcss-tag-graph-link').forEach(function (node) {
    node.addEventListener('mouseenter', function () {
      var tagId = node.getAttribute('data-tag');
      setActive(tagId ? [tagId] : [], node.getAttribute('data-post'));
    });
    node.addEventListener('mouseleave', applySelection);
    node.addEventListener('focus', function () {
      var tagId = node.getAttribute('data-tag');
      setActive(tagId ? [tagId] : [], node.getAttribute('data-post'));
    });
    node.addEventListener('blur', applySelection);
    node.addEventListener('click', function (event) {
      var tagId = node.getAttribute('data-tag');

      if (!tagId) {
        return;
      }

      event.preventDefault();
      selectTag(tagId);
      updateHash();
    });
  });

  window.addEventListener('hashchange', selectTagFromHash);
  selectTagFromHash();
})();
