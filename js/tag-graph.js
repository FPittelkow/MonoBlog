(function () {
  var graph = document.querySelector('[data-tag-graph]');
  var svg = graph && graph.querySelector('svg');
  var loading = document.querySelector('[data-tag-graph-loading]');
  var insight = document.querySelector('[data-tag-insight]');
  var data = window.tagGraphData;

  if (!graph || !svg || !data || !data.posts || !data.posts.length) {
    return;
  }

  var ns = 'http://www.w3.org/2000/svg';
  var width = 1080;
  var height = 660;
  var centerX = width / 2;
  var centerY = height / 2;
  var selectedId = '';
  var hoveredId = '';
  var draggedNode = null;
  var pointerStart = null;
  var frame = 0;
  var maxFrames = 380;
  var spacingLevels = {
    tight: 0.92,
    normal: 1.12,
    roomy: 1.42
  };
  var spacing = 'roomy';
  var motionOK = !window.matchMedia ||
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var categoryUrls = {
    artifact: '/artifacts',
    text: '/text',
    tools: '/tools'
  };

  svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-labelledby', 'tag-graph-title tag-graph-desc');
  svg.innerHTML = '';
  svg.appendChild(create('title', { id: 'tag-graph-title' }, 'Graph of blog tags and categories'));
  svg.appendChild(create(
    'desc',
    { id: 'tag-graph-desc' },
    'Posts connect categories and tags. Select a node to highlight related posts and metadata.'
  ));
  graph.classList.add('is-ready');
  if (loading) {
    loading.hidden = true;
  }

  var model = buildModel(data.posts);
  var edgeLayer = create('g', { class: 't-hackcss-tag-graph-edges' });
  var nodeLayer = create('g', { class: 't-hackcss-tag-graph-nodes' });
  svg.appendChild(edgeLayer);
  svg.appendChild(nodeLayer);

  model.edges.forEach(function (edge) {
    edge.el = create('line', {
      class: 't-hackcss-tag-graph-edge',
      'data-from': edge.source.id,
      'data-to': edge.target.id
    });
    edgeLayer.appendChild(edge.el);
  });

  model.nodes.forEach(function (node) {
    var link = create('a', {
      href: node.url || '#',
      class: 't-hackcss-tag-graph-link',
      'data-node': node.id,
      'data-kind': node.kind,
      'aria-label': node.kind + ': ' + node.name
    });
    var group = create('g', {
      class: 't-hackcss-tag-graph-node',
      'data-node': node.id,
      'data-kind': node.kind
    });

    node.el = group;
    node.hit = create('circle', {
      r: Math.max(node.radius + 11, 18),
      class: 't-hackcss-tag-graph-hit'
    });
    node.circle = create('circle', {
      r: node.radius,
      class: 't-hackcss-tag-graph-dot'
    });
    node.label = create('text', {
      class: 't-hackcss-tag-graph-label',
      x: node.radius + 7,
      y: 4
    }, graphLabel(node));

    group.appendChild(create('title', {}, node.name));
    group.appendChild(node.hit);
    group.appendChild(node.circle);
    group.appendChild(node.label);
    link.appendChild(group);
    nodeLayer.appendChild(link);

    link.addEventListener('mouseenter', function () {
      hoveredId = node.id;
      applyFocus();
    });
    link.addEventListener('mouseleave', function () {
      hoveredId = '';
      applyFocus();
    });
    link.addEventListener('focus', function () {
      hoveredId = node.id;
      applyFocus();
    });
    link.addEventListener('blur', function () {
      hoveredId = '';
      applyFocus();
    });
    link.addEventListener('click', function (event) {
      if (node.kind !== 'post') {
        event.preventDefault();
        selectedId = selectedId === node.id ? '' : node.id;
        updateHash();
        renderInsight();
        applyFocus();
      }
    });
    link.addEventListener('pointerdown', function (event) {
      if (!motionOK) {
        return;
      }

      draggedNode = node;
      pointerStart = svgPoint(event);
      node.fx = node.x;
      node.fy = node.y;
      link.setPointerCapture(event.pointerId);
      link.classList.add('is-dragging');
    });
    link.addEventListener('pointermove', function (event) {
      if (!draggedNode || draggedNode !== node) {
        return;
      }

      var point = svgPoint(event);
      node.fx = clamp(point.x, 22, width - 22);
      node.fy = clamp(point.y, 22, height - 22);
      node.x = node.fx;
      node.y = node.fy;
      frame = 0;
      tick();
    });
    link.addEventListener('pointerup', function (event) {
      if (draggedNode !== node) {
        return;
      }

      link.releasePointerCapture(event.pointerId);
      link.classList.remove('is-dragging');
      draggedNode = null;
      pointerStart = null;
    });
  });

  renderLegend();
  renderSpacingControls();
  selectFromHash();
  renderInsight();
  applyFocus();

  if (motionOK) {
    requestAnimationFrame(run);
  } else {
    for (var i = 0; i < maxFrames; i += 1) {
      simulate();
    }
    tick();
  }

  window.addEventListener('hashchange', selectFromHash);

  function create(name, attrs, text) {
    var node = document.createElementNS(ns, name);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    if (text) {
      node.textContent = text;
    }
    return node;
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

  function slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function truncate(value, length) {
    value = String(value || '');
    return value.length > length ? value.slice(0, length - 3) + '...' : value;
  }

  function graphLabel(node) {
    if (node.kind === 'post') {
      return truncate(node.name, 28);
    }

    return truncate(node.name, 22);
  }

  function svgPoint(event) {
    var point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  function buildModel(posts) {
    var nodes = [];
    var nodeById = {};
    var edges = [];

    function upsertNode(id, kind, name, url) {
      if (nodeById[id]) {
        nodeById[id].count += 1;
        return nodeById[id];
      }

      var angle = nodes.length * 2.399963;
      var radius = kind === 'post' ? 155 : 220;
      var node = {
        id: id,
        kind: kind,
        name: name,
        url: url || '',
        count: 1,
        links: [],
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };

      nodes.push(node);
      nodeById[id] = node;
      return node;
    }

    posts.forEach(function (post, index) {
      var postNode = upsertNode('post-' + index, 'post', post.title, post.url);
      var categories = post.categories || [];
      var tags = post.tags || [];

      postNode.count = 1;
      postNode.categories = categories;
      postNode.tags = tags;

      categories.forEach(function (category) {
        var categorySlug = slug(category);
        var categoryNode = upsertNode(
          'category-' + categorySlug,
          'category',
          category,
          categoryUrls[categorySlug] || ''
        );
        connect(categoryNode, postNode, edges);
      });

      tags.forEach(function (tag) {
        var tagNode = upsertNode('tag-' + slug(tag), 'tag', tag, '/tags#tag-' + slug(tag));
        connect(postNode, tagNode, edges);
      });
    });

    nodes.forEach(function (node) {
      if (node.kind === 'category') {
        node.radius = 9 + Math.min(7, node.count * 1.2);
        node.homeX = width * 0.23;
        node.homeY = centerY;
      } else if (node.kind === 'tag') {
        node.radius = 7 + Math.min(8, node.count * 1.1);
        node.homeX = width * 0.76;
        node.homeY = centerY;
      } else {
        node.radius = 7;
        node.homeX = centerX;
        node.homeY = centerY;
      }
    });

    return {
      nodes: nodes,
      edges: edges
    };
  }

  function connect(source, target, edges) {
    edges.push({
      source: source,
      target: target
    });
    source.links.push(target);
    target.links.push(source);
  }

  function spacingScale() {
    return spacingLevels[spacing] || spacingLevels.roomy;
  }

  function restartSimulation() {
    frame = 0;
    model.nodes.forEach(function (node) {
      node.fx = null;
      node.fy = null;
      node.vx = 0;
      node.vy = 0;
    });

    if (motionOK) {
      requestAnimationFrame(run);
    } else {
      for (var i = 0; i < maxFrames; i += 1) {
        simulate();
      }
      tick();
    }
  }

  function run() {
    simulate();
    tick();
    frame += 1;

    if (frame < maxFrames || draggedNode) {
      requestAnimationFrame(run);
    }
  }

  function simulate() {
    var nodes = model.nodes;
    var edges = model.edges;
    var alpha = Math.max(0.015, 1 - frame / maxFrames);

    edges.forEach(function (edge) {
      var dx = edge.target.x - edge.source.x;
      var dy = edge.target.y - edge.source.y;
      var distance = Math.sqrt(dx * dx + dy * dy) || 1;
      var ideal = (edge.source.kind === 'post' && edge.target.kind === 'tag' ? 118 : 132) * spacingScale();
      var force = (distance - ideal) * 0.018 * alpha;
      var fx = dx / distance * force;
      var fy = dy / distance * force;

      if (edge.source.fx === null || edge.source.fx === undefined) {
        edge.source.vx += fx;
        edge.source.vy += fy;
      }
      if (edge.target.fx === null || edge.target.fx === undefined) {
        edge.target.vx -= fx;
        edge.target.vy -= fy;
      }
    });

    nodes.forEach(function (left, leftIndex) {
      nodes.slice(leftIndex + 1).forEach(function (right) {
        var dx = right.x - left.x;
        var dy = right.y - left.y;
        var distanceSq = dx * dx + dy * dy || 1;
        var minDistance = left.radius + right.radius + 28 * spacingScale();
        var strength = Math.min(3.2, (1180 * spacingScale()) / distanceSq) * alpha;

        if (distanceSq < minDistance * minDistance) {
          strength += (minDistance - Math.sqrt(distanceSq)) * 0.03;
        }

        var distance = Math.sqrt(distanceSq);
        var fx = dx / distance * strength;
        var fy = dy / distance * strength;

        if (left.fx === null || left.fx === undefined) {
          left.vx -= fx;
          left.vy -= fy;
        }
        if (right.fx === null || right.fx === undefined) {
          right.vx += fx;
          right.vy += fy;
        }
      });
    });

    nodes.forEach(function (node) {
      if (node.fx === null || node.fx === undefined) {
        node.vx += (node.homeX - node.x) * 0.0045 * alpha;
        node.vy += (node.homeY - node.y) * 0.0045 * alpha;
        node.vx *= 0.82;
        node.vy *= 0.82;
        node.x += node.vx;
        node.y += node.vy;
      } else {
        node.x = node.fx;
        node.y = node.fy;
      }

      node.x = clamp(node.x, 24, width - 120);
      node.y = clamp(node.y, 24, height - 24);
    });
  }

  function tick() {
    model.edges.forEach(function (edge) {
      edge.el.setAttribute('x1', edge.source.x);
      edge.el.setAttribute('y1', edge.source.y);
      edge.el.setAttribute('x2', edge.target.x);
      edge.el.setAttribute('y2', edge.target.y);
    });

    model.nodes.forEach(function (node) {
      node.el.setAttribute('transform', 'translate(' + node.x.toFixed(2) + ' ' + node.y.toFixed(2) + ')');
    });
  }

  function renderLegend() {
    var legend = createElement('div', 't-hackcss-tag-legend');
    [
      ['category', 'Categories'],
      ['post', 'Posts'],
      ['tag', 'Tags']
    ].forEach(function (item) {
      var entry = createElement('span', 't-hackcss-tag-legend-item');
      var mark = createElement('span', 't-hackcss-tag-legend-mark t-hackcss-tag-legend-mark-' + item[0]);
      entry.appendChild(mark);
      entry.appendChild(document.createTextNode(item[1]));
      legend.appendChild(entry);
    });
    graph.appendChild(legend);
  }

  function renderSpacingControls() {
    var controls = createElement('div', 't-hackcss-tag-spacing');
    var label = createElement('span', 't-hackcss-tag-spacing-label', 'Spacing');

    controls.appendChild(label);
    ['tight', 'normal', 'roomy'].forEach(function (level) {
      var button = createElement(
        'button',
        't-hackcss-tag-spacing-button' + (spacing === level ? ' is-selected' : ''),
        level.charAt(0).toUpperCase() + level.slice(1)
      );

      button.type = 'button';
      button.setAttribute('data-spacing', level);
      button.setAttribute('aria-pressed', String(spacing === level));
      button.addEventListener('click', function () {
        spacing = level;
        graph.querySelectorAll('.t-hackcss-tag-spacing-button').forEach(function (node) {
          var selected = node.getAttribute('data-spacing') === spacing;
          node.classList.toggle('is-selected', selected);
          node.setAttribute('aria-pressed', String(selected));
        });
        restartSimulation();
      });

      controls.appendChild(button);
    });

    graph.insertBefore(controls, svg);
  }

  function relatedIds(node) {
    var ids = {};
    ids[node.id] = true;
    node.links.forEach(function (linked) {
      ids[linked.id] = true;
      if (node.kind !== 'post') {
        linked.links.forEach(function (second) {
          ids[second.id] = true;
        });
      }
    });
    return ids;
  }

  function currentFocusNode() {
    var id = hoveredId || selectedId;
    return model.nodes.filter(function (node) {
      return node.id === id;
    })[0];
  }

  function applyFocus() {
    var focus = currentFocusNode();
    var ids = focus ? relatedIds(focus) : {};
    var activeEdge = {};

    if (focus) {
      model.edges.forEach(function (edge) {
        if (ids[edge.source.id] && ids[edge.target.id]) {
          activeEdge[edge.source.id + '|' + edge.target.id] = true;
        }
      });
    }

    model.nodes.forEach(function (node) {
      var active = !focus || Boolean(ids[node.id]);
      node.el.classList.toggle('is-muted', !active);
      node.el.classList.toggle('is-selected', selectedId === node.id);
      node.el.classList.toggle('is-hovered', hoveredId === node.id);
    });

    model.edges.forEach(function (edge) {
      var key = edge.source.id + '|' + edge.target.id;
      var active = !focus || Boolean(activeEdge[key]);
      edge.el.classList.toggle('is-muted', !active);
      edge.el.classList.toggle('is-active', focus && active);
    });
  }

  function updateHash() {
    if (selectedId) {
      history.pushState('', document.title, window.location.pathname + window.location.search + '#' + selectedId);
    } else if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }

  function selectFromHash() {
    var hash = window.location.hash.replace(/^#/, '');
    var direct = model.nodes.filter(function (node) {
      return node.id === hash;
    })[0];
    var legacyTag = model.nodes.filter(function (node) {
      return node.id === 'tag-' + hash.replace(/^tag-/, '');
    })[0];

    selectedId = direct ? direct.id : (legacyTag ? legacyTag.id : '');
    renderInsight();
    applyFocus();
  }

  function postsForNode(node) {
    if (!node) {
      return model.nodes.filter(function (candidate) {
        return candidate.kind === 'post';
      });
    }

    if (node.kind === 'post') {
      return [node];
    }

    return node.links.filter(function (candidate) {
      return candidate.kind === 'post';
    }).sort(function (left, right) {
      return left.name.localeCompare(right.name);
    });
  }

  function nodesByKind(kind) {
    return model.nodes.filter(function (node) {
      return node.kind === kind;
    }).sort(function (left, right) {
      return right.count - left.count || left.name.localeCompare(right.name);
    });
  }

  function renderInsight() {
    if (!insight) {
      return;
    }

    var node = currentFocusNode();
    var posts = postsForNode(node);
    insight.innerHTML = '';

    if (!node) {
      insight.appendChild(createElement(
        'p',
        't-hackcss-tag-insight-summary',
        model.nodes.length + ' nodes connect ' + data.posts.length + ' posts, ' +
        nodesByKind('category').length + ' categories, and ' + nodesByKind('tag').length + ' tags.'
      ));
      insight.appendChild(renderNodeSection('Categories', nodesByKind('category')));
      insight.appendChild(renderNodeSection('Frequent tags', nodesByKind('tag').slice(0, 12)));
      return;
    }

    insight.appendChild(createElement('h2', null, node.name));
    insight.appendChild(createElement(
      'p',
      't-hackcss-tag-insight-summary',
      node.kind.charAt(0).toUpperCase() + node.kind.slice(1) + ' linked to ' +
      posts.length + ' ' + (posts.length === 1 ? 'post' : 'posts') + '.'
    ));

    if (node.kind === 'post') {
      insight.appendChild(renderNodeSection('Categories', node.links.filter(byKind('category'))));
      insight.appendChild(renderNodeSection('Tags', node.links.filter(byKind('tag'))));
    } else {
      insight.appendChild(renderPostSection('Posts', posts));
      insight.appendChild(renderNodeSection('Related tags', relatedTags(posts, node)));
    }
  }

  function byKind(kind) {
    return function (node) {
      return node.kind === kind;
    };
  }

  function relatedTags(posts, selectedNode) {
    var seen = {};
    posts.forEach(function (post) {
      post.links.filter(byKind('tag')).forEach(function (tag) {
        if (tag.id !== selectedNode.id) {
          seen[tag.id] = tag;
        }
      });
    });
    return Object.keys(seen).map(function (id) {
      return seen[id];
    }).sort(function (left, right) {
      return right.count - left.count || left.name.localeCompare(right.name);
    });
  }

  function renderNodeSection(title, nodes) {
    var section = createElement('section', 't-hackcss-tag-insight-section');
    var list = createElement('ul', 't-hackcss-tag-insight-tags');

    section.appendChild(createElement('h3', null, title));
    if (!nodes.length) {
      section.appendChild(createElement('p', null, 'None.'));
      return section;
    }

    nodes.forEach(function (node) {
      var item = createElement('li');
      var link = createElement('a', null, node.name);
      var count = createElement('span', null, String(node.count));
      link.href = '#' + node.id;
      item.className = node.kind === 'category' ? 't-hackcss-tag-insight-category' : '';
      item.appendChild(link);
      item.appendChild(count);
      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  function renderPostSection(title, posts) {
    var section = createElement('section', 't-hackcss-tag-insight-section');
    var list = createElement('ol', 't-hackcss-tag-insight-posts');

    section.appendChild(createElement('h3', null, title));
    posts.forEach(function (post) {
      var item = createElement('li');
      var link = createElement('a', null, post.name);
      link.href = post.url;
      item.appendChild(link);
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }
})();
