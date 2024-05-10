import intersectRect from '../rendering-elements/intersect/intersect-rect.js';
import { log } from '$root/logger.js';
import createLabel from './createLabel.js';
import { createText } from '../createText.ts';
import { select } from 'd3';
import { getConfig } from '$root/diagram-api/diagramAPI.js';
import { evaluate } from '$root/diagrams/common/common.js';
import { getSubGraphTitleMargins } from '$root/utils/subGraphTitleMargins.js';
import rough from 'roughjs';
import { createRoundedRectPathD } from './shapes/roundedRectPath.ts';

const rect = (parent, node) => {
  log.info('Creating subgraph rect for ', node.id, node);
  const siteConfig = getConfig();

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster' + (node.class ? ' ' + node.class : ''))
    .attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  const useHtmlLabels = evaluate(siteConfig.flowchart.htmlLabels);

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'cluster-label');

  // const text = label
  //   .node()
  //   .appendChild(createLabel(node.labelText, node.labelStyle, undefined, true));
  const text =
    node.labelType === 'markdown'
      ? createText(label, node.labelText, { style: node.labelStyle, useHtmlLabels })
      : label.node().appendChild(createLabel(node.labelText, node.labelStyle, undefined, true));

  // Get the size of the label
  let bbox = text.getBBox();

  if (evaluate(siteConfig.flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  const width = node.width <= bbox.width + padding ? bbox.width + padding : node.width;
  if (node.width <= bbox.width + padding) {
    node.diff = (bbox.width - node.width) / 2 - node.padding / 2;
  } else {
    node.diff = -node.padding / 2;
  }

  log.trace('Data ', node, JSON.stringify(node));
  // center the rect around its coordinate
  rect
    .attr('style', node.style)
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', node.x - width / 2)
    .attr('y', node.y - node.height / 2 - halfPadding)
    .attr('width', width)
    .attr('height', node.height + padding);

  const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
  if (useHtmlLabels) {
    label.attr(
      'transform',
      // This puts the labal on top of the box instead of inside it
      `translate(${node.x - bbox.width / 2}, ${node.y - node.height / 2 + subGraphTitleTopMargin})`
    );
  } else {
    label.attr(
      'transform',
      // This puts the labal on top of the box instead of inside it
      `translate(${node.x}, ${node.y - node.height / 2 + subGraphTitleTopMargin})`
    );
  }
  // Center the label

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

/**
 * Non visible cluster where the note is group with its
 *
 * @param {any} parent
 * @param {any} node
 * @returns {any} ShapeSvg
 */
const noteGroup = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent.insert('g').attr('class', 'note-cluster').attr('id', node.id);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  // center the rect around its coordinate
  rect
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', node.x - node.width / 2 - halfPadding)
    .attr('y', node.y - node.height / 2 - halfPadding)
    .attr('width', node.width + padding)
    .attr('height', node.height + padding)
    .attr('fill', 'none');

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};
const roundedWithTitle = (parent, node) => {
  const siteConfig = getConfig();

  console.log('DAGO node in roundedWithTitle', siteConfig.themeVariables);

  const { themeVariables } = siteConfig;
  const { altBackground, compositeBackground, compositeTitleBackground, nodeBorder } =
    themeVariables;

  // Add outer g element
  const shapeSvg = parent.insert('g').attr('class', node.classes).attr('id', node.id);

  // add the rect
  const outerRectG = shapeSvg.insert('g', ':first-child');

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'cluster-label');
  let innerRect = shapeSvg.append('rect');

  const text = label
    .node()
    .appendChild(createLabel(node.labelText, node.labelStyle, undefined, true));

  // Get the size of the label
  let bbox = text.getBBox();
  if (evaluate(siteConfig.flowchart.htmlLabels)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }
  bbox = text.getBBox();
  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  const width =
    (node.width <= bbox.width + node.padding ? bbox.width + node.padding : node.width) + padding;
  if (node.width <= bbox.width + node.padding) {
    node.diff = (bbox.width + node.padding * 0 - node.width) / 2;
  } else {
    node.diff = -node.padding / 2;
  }

  const x = node.x - width / 2 - halfPadding;
  const y = node.y - node.height / 2 - halfPadding;
  const innerY = node.y - node.height / 2 - halfPadding + bbox.height - 1;
  const height = node.height + padding;
  const innerHeight = node.height + padding - bbox.height - 3;

  // add the rect
  let rect;
  if (node.useRough) {
    const isAlt = node.classes.includes('statediagram-cluster-alt');
    const rc = rough.svg(shapeSvg);
    const roughOuterNode =
      node.rx || node.ry
        ? rc.path(createRoundedRectPathD(x, y, width, height, 10), {
            roughness: 0.7,
            fill: compositeTitleBackground,
            fillStyle: 'solid',
            stroke: nodeBorder,
          })
        : rc.rectangle(x, y, width, height);

    rect = shapeSvg.insert(() => roughOuterNode, ':first-child');
    const roughInnerNode = rc.rectangle(x, innerY, width, innerHeight, {
      fill: isAlt ? altBackground : compositeBackground,
      fillStyle: isAlt ? 'hachure' : 'solid',
      stroke: nodeBorder,
    });

    rect = shapeSvg.insert(() => roughOuterNode, ':first-child');
    innerRect = shapeSvg.insert(() => roughInnerNode);
  } else {
    rect = outerRectG.insert('rect', ':first-child');
    // center the rect around its coordinate
    rect
      .attr('class', 'outer')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', node.height + padding);
    innerRect
      .attr('class', 'inner')
      .attr('x', x)
      .attr('y', innerY)
      .attr('width', width)
      .attr('height', innerHeight);
  }

  const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
  // Center the label
  label.attr(
    'transform',
    `translate(${node.x - bbox.width / 2}, ${
      node.y -
      node.height / 2 -
      node.padding / 3 +
      (evaluate(siteConfig.flowchart.htmlLabels) ? 5 : 3) +
      subGraphTitleTopMargin
    })`
  );

  const rectBox = rect.node().getBBox();
  node.height = rectBox.height;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

const divider = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent.insert('g').attr('class', node.classes).attr('id', node.id);

  // add the rect
  let rect;

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  const x = node.x - node.width / 2 - halfPadding;
  const y = node.y - node.height / 2;
  const width = node.width + padding;
  const height = node.height + padding;
  if (node.useRough) {
    const rc = rough.svg(shapeSvg);
    const roughNode = rc.rectangle(x, y, width, height, {
      fill: 'lightgrey',
      roughness: 0.5,
      strokeLineDash: [5],
    });

    rect = shapeSvg.insert(() => roughNode);
  } else {
    rect = shapeSvg.insert('rect', ':first-child');
    // center the rect around its coordinate
    rect
      .attr('class', 'divider')
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height);
  }
  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;
  node.diff = -node.padding / 2;
  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return shapeSvg;
};

const shapes = { rect, roundedWithTitle, noteGroup, divider };

let clusterElems = {};

export const insertCluster = (elem, node) => {
  log.trace('Inserting cluster');
  const shape = node.shape || 'rect';
  const cluster = shapes[shape](elem, node);
  clusterElems[node.id] = cluster;
  return cluster;
};
export const getClusterTitleWidth = (elem, node) => {
  const label = createLabel(node.labelText, node.labelStyle, undefined, true);
  elem.node().appendChild(label);
  const width = label.getBBox().width;
  elem.node().removeChild(label);
  return width;
};

export const clear = () => {
  clusterElems = {};
};

export const positionCluster = (node) => {
  log.info('Position cluster (' + node.id + ', ' + node.x + ', ' + node.y + ')');
  const el = clusterElems[node.id];

  el.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
};
