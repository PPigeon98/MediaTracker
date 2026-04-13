<script setup lang="ts">
  import * as d3 from 'd3'
  import { onMounted, onUnmounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import BaseButtonBack from './BaseButtonBack.vue'
  import { getItems, getItemRelations, type Item } from './FeatureDatabase.vue'
  import { typeVariableNames } from '../utils/types'

  type NodeDatum = {
    id: number;
    label: string;
    shortLabel: string;
    lines: string[];
    radius: number;
    color: string;
  }

  type LinkDatum = {
    source: number;
    target: number;
    value: number;
    description: string;
  }

  const router = useRouter()
  const graphRoot = ref<HTMLDivElement | null>(null)
  let simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null

  function wrapWords(text: string, maxCharsPerLine = 10, maxLines = 3): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return ['']
    const lines: string[] = []
    let current = ''

    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (next.length <= maxCharsPerLine) {
        current = next
      } else {
        if (current) lines.push(current)
        if (word.length > maxCharsPerLine) {
          lines.push(word.slice(0, maxCharsPerLine))
          current = word.slice(maxCharsPerLine)
        } else {
          current = word
        }
      }
      if (lines.length >= maxLines - 1) break
    }

    if (lines.length < maxLines && current) lines.push(current)
    if (lines.length > maxLines) lines.length = maxLines
    if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(1, maxCharsPerLine - 1))}…`
    }
    return lines
  }

  function navigateToDetails(id: number) {
    router.push(`/Details?item=${id}`)
  }

  async function loadGraphData(): Promise<{ nodes: NodeDatum[]; links: LinkDatum[] }> {
    const items = await getItems(false)
    const nodes: NodeDatum[] = items.map((item: Item) => {
      const label = item.title || `Item #${item.id}`
      const lines = wrapWords(label, 10, 3)
      const longest = lines.reduce((max, line) => Math.max(max, line.length), 0)
      const lineCount = lines.length
      const widthRadius = (longest * 5.2) / 2 + 10
      const heightRadius = (lineCount * 10) / 2 + 10
      return {
        id: item.id,
        label,
        shortLabel: label.slice(0, 14),
        lines,
        radius: Math.max(18, Math.min(48, Math.max(widthRadius, heightRadius))),
        color: `var(--colour-${typeVariableNames[item.mediaType] ?? 'other'})`
      }
    })

    const links: LinkDatum[] = []
    const seen = new Set<string>()
    for (const item of items) {
      const relations = await getItemRelations(item.id)
      for (const relation of relations) {
        if (!relation.relatedItemId || relation.relatedItemId === item.id) continue
        const a = Math.min(item.id, relation.relatedItemId)
        const b = Math.max(item.id, relation.relatedItemId)
        const dedupe = `${a}-${b}`
        if (seen.has(dedupe)) continue
        seen.add(dedupe)
        links.push({
          source: item.id,
          target: relation.relatedItemId,
          value: 1,
          description: relation.description || ''
        })
      }
    }

    return { nodes, links }
  }

  function renderGraph(nodesInput: NodeDatum[], linksInput: LinkDatum[]) {
    if (!graphRoot.value) return
    graphRoot.value.innerHTML = ''

    const width = Math.max(1, graphRoot.value.clientWidth || 1)
    const height = Math.max(1, graphRoot.value.clientHeight || 1)
    const nodes = nodesInput.map((d) => ({ ...d }))
    const links = linksInput.map((d) => ({ ...d }))

    simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[]).id((d: any) => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('x', d3.forceX().strength(0.03))
      .force('y', d3.forceY().strength(0.03))
      .force('collide', d3.forceCollide(14))

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('style', 'width:100%; height:100%; display:block; transition:none;')

    const viewport = svg.append('g').attr('class', 'viewport')

    const link = viewport.append('g')
      .attr('stroke', 'var(--ctp-text)')
      .attr('stroke-opacity', 0.7)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d: LinkDatum) => Math.sqrt(d.value))
      .style('transition', 'none')

    const node = viewport.append('g')
      .attr('stroke', '#11111b')
      .attr('stroke-width', 1.4)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: NodeDatum) => d.radius)
      .attr('fill', (d: NodeDatum) => d.color)
      .style('cursor', 'pointer')
      .style('transition', 'none')

    const nodeText = viewport.append('g')
      .selectAll<SVGTextElement, NodeDatum>('text')
      .data(nodes)
      .join('text')
      .attr('font-size', 9)
      .attr('font-weight', 700)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--colour-base-100)')
      .style('pointer-events', 'none')
      .style('transition', 'none')

    nodeText.selectAll('tspan').remove()
    nodeText.each(function(d: NodeDatum) {
      const text = d3.select(this)
      const lineHeightEm = 1.1
      const startOffsetEm = -((d.lines.length - 1) * lineHeightEm) / 2
      d.lines.forEach((line, index) => {
        text.append('tspan')
          .attr('x', 0)
          .attr('dy', index === 0 ? `${startOffsetEm}em` : `${lineHeightEm}em`)
          .text(line)
      })
    })

    node.append('title').text((d: NodeDatum) => d.label)
    link.append('title').text((d: LinkDatum) => d.description || 'related')

    node.on('click', (_event: MouseEvent, d: NodeDatum) => navigateToDetails(d.id))

    const drag = d3.drag<SVGCircleElement, any>()
      .on('start', (event: d3.D3DragEvent<SVGCircleElement, any, any>) => {
        if (!event.active && simulation) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      })
      .on('drag', (event: d3.D3DragEvent<SVGCircleElement, any, any>) => {
        event.subject.fx = event.x
        event.subject.fy = event.y
      })
      .on('end', (event: d3.D3DragEvent<SVGCircleElement, any, any>) => {
        if (!event.active && simulation) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      })

    node.call(drag as any)

    const zoom = d3.zoom<SVGSVGElement, any>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString())
      })

    ;(svg as any).call(zoom)
    ;(svg as any).call(zoom.transform, d3.zoomIdentity)

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      nodeText
        .attr('transform', (d: any) => `translate(${d.x}, ${d.y + 1.5})`)
    })

    graphRoot.value.append(svg.node()!)
  }

  async function refreshGraph() {
    const { nodes, links } = await loadGraphData()
    renderGraph(nodes, links)
  }

  function handleResize() {
    refreshGraph()
  }

  onMounted(async () => {
    await refreshGraph()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (simulation) simulation.stop()
  })
</script>

<template>
  <div class="graphPage">
    <BaseButtonBack />
    <div ref="graphRoot" class="graphRoot"></div>
  </div>
</template>

<style scoped>
  .graphPage {
    height: calc(100vh - var(--window-bar-stack-height));
    left: 0;
    position: fixed;
    top: var(--window-bar-stack-height);
    width: 100vw;
    z-index: 1;
  }

  .graphRoot {
    background-color: var(--colour-base-200);
    height: 100%;
    overflow: hidden;
    width: 100%;
  }
</style>
