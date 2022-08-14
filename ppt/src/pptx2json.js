function pptx2html(file, wrap) {
  const processSlideList = processPPTX(file)
  const json = []

  for (const item of processSlideList) {
    wrap.insertAdjacentHTML('beforeend', item.html)
    json.push(item.json)

  }
  // createChart()
  itemToOption(json)
  // console.log(json)
}

const chartList = []
function createChart() {
  for(item of chartList) {
    const { chartID, chartType, chartData } = item
    let option = {}
    
		switch (chartType) {
			case 'lineChart':
        option = {
          xAxis: {
            type: 'category',
            data: Object.values(chartData[0].xlabels),
          },
          yAxis: {
            type: 'value'
          },
          series: chartData.map(item => ({
            type: 'line',
            data: item.values.map(value => value.y),
          }))
        }
				break
			case 'barChart':
				option = {
          xAxis: {
            type: 'category',
            data: Object.values(chartData[0].xlabels),
          },
          yAxis: {
            type: 'value'
          },
          series: chartData.map(item => ({
            type: 'bar',
            data: item.values.map(value => value.y),
          }))
        }
				break
			case 'stackedBarChart':
				option = {
          xAxis: {
            type: 'category',
            data: Object.values(chartData[0].xlabels),
          },
          yAxis: {
            type: 'value'
          },
          series: chartData.map(item => ({
            type: 'bar',
            stack: 'total',
            data: item.values.map(value => value.y),
          }))
        }
				break
      case 'pie3DChart':
			case 'pieChart':
        option = {
          series: chartData.map(item => ({
            name: 'Access From',
            type: 'pie',
            radius: '70%',
            data: item.values.map((value, index) => ({
              value: value.y,
              name: item.xlabels[index],
            })),
          }))
        }
				break
			case 'areaChart':
				option = {
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: Object.values(chartData[0].xlabels),
          },
          yAxis: {
            type: 'value'
          },
          series: chartData.map(item => ({
            type: 'line',
            areaStyle: {},
            data: item.values.map(value => value.y),
          }))
        }
        break
			case 'stackedAreaChart':
				option = {
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: Object.values(chartData[0].xlabels),
          },
          yAxis: {
            type: 'value'
          },
          series: chartData.map(item => ({
            type: 'line',
            areaStyle: {},
            stack: 'Total',
            data: item.values.map(value => value.y),
          }))
        }
        break
			case 'scatterChart':
				option = {
          xAxis: {},
          yAxis: {},
          series: [
            {
              symbolSize: 10,
              data: chartData[0].map((item, index) => [item, chartData[1][index]]),
              type: 'scatter',
            }
          ]
        }
				break
			default:
		}
    const chartDom = document.querySelector('#' + chartID)
    const myChart = echarts.init(chartDom)
    myChart.setOption(option)
  }
}

let themeContent = null
function processPPTX(data) {
  const processSlideList = []
  const zip = new JSZip(data)

  const filesInfo = getContentTypes(zip)
  const slideSize = getSlideSize(zip)
  themeContent = loadTheme(zip)

  const numOfSlides = filesInfo['slides'].length
  for (let i = 0; i < numOfSlides; i++) {
    const filename = filesInfo['slides'][i]
    const { html, json } = processSingleSlide(zip, filename, i, slideSize)
    processSlideList.push({ html, json })
  }

  return processSlideList
}

function readXmlFile(zip, filename) {
  return tXml(zip.file(filename).asText())
}

function getContentTypes(zip) {
  const ContentTypesJson = readXmlFile(zip, '[Content_Types].xml')
  const subObj = ContentTypesJson['Types']['Override']
  const slidesLocArray = []
  const slideLayoutsLocArray = []

  for (const item of subObj) {
    switch (item['attrs']['ContentType']) {
      case 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml':
        slidesLocArray.push(item['attrs']['PartName'].substr(1))
        break
      case 'application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml':
        slideLayoutsLocArray.push(item['attrs']['PartName'].substr(1))
        break
      default:
    }
  }
  return {
    slides: slidesLocArray,
    slideLayouts: slideLayoutsLocArray,
  }
}

function getSlideSize(zip) {
  // Pixel = EMUs * Resolution / 914400  (Resolution = 96)
  const content = readXmlFile(zip, 'ppt/presentation.xml')
  const sldSzAttrs = content['p:presentation']['p:sldSz']['attrs']
  return {
    width: parseInt(sldSzAttrs['cx']) * 96 / 914400,
    height: parseInt(sldSzAttrs['cy']) * 96 / 914400,
  }
}

function loadTheme(zip) {
  const preResContent = readXmlFile(zip, 'ppt/_rels/presentation.xml.rels')
  const relationshipArray = preResContent['Relationships']['Relationship']
  let themeURI

  if (relationshipArray.constructor === Array) {
    for (const relationshipItem of relationshipArray) {
      if (relationshipItem['attrs']['Type'] === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme') {
        themeURI = relationshipItem['attrs']['Target']
        break
      }
    }
  } 
  else if (relationshipArray['attrs']['Type'] === 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme') {
    themeURI = relationshipArray['attrs']['Target']
  }

  if (!themeURI) throw Error(`Can't open theme file.`)

  return readXmlFile(zip, 'ppt/' + themeURI)
}

function processSingleSlide(zip, sldFileName, index, slideSize) {
  // =====< Step 1 >=====
  // Read relationship filename of the slide (Get slideLayoutXX.xml)
  // @sldFileName: ppt/slides/slide1.xml
  // @resName: ppt/slides/_rels/slide1.xml.rels
  const resName = sldFileName.replace('slides/slide', 'slides/_rels/slide') + '.rels'
  const resContent = readXmlFile(zip, resName)
  let RelationshipArray = resContent['Relationships']['Relationship']
  let layoutFilename = ''
  const slideResObj = {}

  if (RelationshipArray.constructor === Array) {
    for (const RelationshipArrayItem of RelationshipArray) {
      switch (RelationshipArrayItem['attrs']['Type']) {
        case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout':
          layoutFilename = RelationshipArrayItem['attrs']['Target'].replace('../', 'ppt/')
          break
        case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide':
        case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image':
        case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart':
        case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink':
        default:
          slideResObj[RelationshipArrayItem['attrs']['Id']] = {
            type: RelationshipArrayItem['attrs']['Type'].replace('http://schemas.openxmlformats.org/officeDocument/2006/relationships/', ''),
            target: RelationshipArrayItem['attrs']['Target'].replace('../', 'ppt/'),
          }
      }
    }
  } 
  else layoutFilename = RelationshipArray['attrs']['Target'].replace('../', 'ppt/')

  // Open slideLayoutXX.xml
  const slideLayoutContent = readXmlFile(zip, layoutFilename)
  const slideLayoutTables = indexNodes(slideLayoutContent)


  // =====< Step 2 >=====
  // Read slide master filename of the slidelayout (Get slideMasterXX.xml)
  // @resName: ppt/slideLayouts/slideLayout1.xml
  // @masterName: ppt/slideLayouts/_rels/slideLayout1.xml.rels
  const slideLayoutResFilename = layoutFilename.replace('slideLayouts/slideLayout', 'slideLayouts/_rels/slideLayout') + '.rels'
  const slideLayoutResContent = readXmlFile(zip, slideLayoutResFilename)
  RelationshipArray = slideLayoutResContent['Relationships']['Relationship']

  let masterFilename = ''
  if (RelationshipArray.constructor === Array) {
    for (const RelationshipArrayItem of RelationshipArray) {
      switch (RelationshipArrayItem['attrs']['Type']) {
        case 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster':
          masterFilename = RelationshipArrayItem['attrs']['Target'].replace('../', 'ppt/')
          break
        default:
      }
    }
  } 
  else masterFilename = RelationshipArray['attrs']['Target'].replace('../', 'ppt/')

  // Open slideMasterXX.xml
  const slideMasterContent = readXmlFile(zip, masterFilename)
  const slideMasterTextStyles = getTextByPathList(slideMasterContent, ['p:sldMaster', 'p:txStyles'])
  const slideMasterTables = indexNodes(slideMasterContent)


  // =====< Step 3 >=====
  const slideContent = readXmlFile(zip, sldFileName)
  const nodes = slideContent['p:sld']['p:cSld']['p:spTree']
  const warpObj = {
    zip,
    slideLayoutTables: slideLayoutTables,
    slideMasterTables: slideMasterTables,
    slideResObj: slideResObj,
    slideMasterTextStyles: slideMasterTextStyles,
  }

  const bgColor = '#' + getSlideBackgroundFill(slideContent, slideLayoutContent, slideMasterContent)

  let html = `<section style="width: ${slideSize.width}px; height: ${slideSize.height}px; background-color: ${bgColor};">`

  const elements = []
  for (const nodeKey in nodes) {
    if (nodes[nodeKey].constructor === Array) {
      for (const node of nodes[nodeKey]) {
        const ret = processNodesInSlide(nodeKey, node, warpObj)
        html += ret.html
        if (ret.json) elements.push(ret.json)
      }
    } 
    else {
      const ret = processNodesInSlide(nodeKey, nodes[nodeKey], warpObj)
      html += ret.html
      if (ret.json) elements.push(ret.json)
    }
  }

  html +=  '</section>'

  const json = {
    width: slideSize.width,
    height: slideSize.height,
    fill: bgColor,
    elements,
  }

  return { html, json }
}

function indexNodes(content) {

  const keys = Object.keys(content)
  const spTreeNode = content[keys[0]]['p:cSld']['p:spTree']

  const idTable = {}
  const idxTable = {}
  const typeTable = {}

  for (const key in spTreeNode) {
    if (key === 'p:nvGrpSpPr' || key === 'p:grpSpPr') continue

    const targetNode = spTreeNode[key]

    if (targetNode.constructor === Array) {
      for (const targetNodeItem of targetNode) {
        const nvSpPrNode = targetNodeItem['p:nvSpPr']
        const id = getTextByPathList(nvSpPrNode, ['p:cNvPr', 'attrs', 'id'])
        const idx = getTextByPathList(nvSpPrNode, ['p:nvPr', 'p:ph', 'attrs', 'idx'])
        const type = getTextByPathList(nvSpPrNode, ['p:nvPr', 'p:ph', 'attrs', 'type'])

        if (id) idTable[id] = targetNodeItem
        if (idx) idxTable[idx] = targetNodeItem
        if (type) typeTable[type] = targetNodeItem
      }
    } 
    else {
      const nvSpPrNode = targetNode['p:nvSpPr']
      const id = getTextByPathList(nvSpPrNode, ['p:cNvPr', 'attrs', 'id'])
      const idx = getTextByPathList(nvSpPrNode, ['p:nvPr', 'p:ph', 'attrs', 'idx'])
      const type = getTextByPathList(nvSpPrNode, ['p:nvPr', 'p:ph', 'attrs', 'type'])

      if (id) idTable[id] = targetNode
      if (idx) idxTable[idx] = targetNode
      if (type) typeTable[type] = targetNode
    }
  }

  return { idTable, idxTable, typeTable }
}

function processNodesInSlide(nodeKey, nodeValue, warpObj) {
  let html = ''
  let json
  let ret

  switch (nodeKey) {
    case 'p:sp': // Shape, Text
      ret = processSpNode(nodeValue, warpObj)
      html += ret.html
      json = ret.json
      break
    case 'p:cxnSp': // Shape, Text (with connection)
      ret = processCxnSpNode(nodeValue, warpObj)
      html += ret.html
      json = ret.json
      break
    case 'p:pic': // Picture
      ret = processPicNode(nodeValue, warpObj)
      html += ret.html
      json = ret.json
      break
    case 'p:graphicFrame': // Chart, Diagram, Table
      ret = processGraphicFrameNode(nodeValue, warpObj)
      html += ret.html
      json = ret.json
      break
    case 'p:grpSp': // 群組
      ret = processGroupSpNode(nodeValue, warpObj)
      html += ret.html
      json = ret.json
      break
    default:
  }

  return { html, json }
}

function processGroupSpNode(node, warpObj) {

  const factor = 96 / 914400

  const xfrmNode = node['p:grpSpPr']['a:xfrm']
  const x = parseInt(xfrmNode['a:off']['attrs']['x']) * factor
  const y = parseInt(xfrmNode['a:off']['attrs']['y']) * factor
  const chx = parseInt(xfrmNode['a:chOff']['attrs']['x']) * factor
  const chy = parseInt(xfrmNode['a:chOff']['attrs']['y']) * factor
  const cx = parseInt(xfrmNode['a:ext']['attrs']['cx']) * factor
  const cy = parseInt(xfrmNode['a:ext']['attrs']['cy']) * factor
  const chcx = parseInt(xfrmNode['a:chExt']['attrs']['cx']) * factor
  const chcy = parseInt(xfrmNode['a:chExt']['attrs']['cy']) * factor

  const order = node['attrs']["order"]

  let html = `<div class="block group" style="z-index: ${order}; top: ${y - chy}px; left: ${x - chx}px; width: ${cx - chcx}px; height: ${cy - chcy}px;">`

  // Procsee all child nodes
  const elements = []
  for (const nodeKey in node) {
    if (node[nodeKey].constructor === Array) {
      for (const item of  node[nodeKey]) {
        const ret = processNodesInSlide(nodeKey, item, warpObj)
        html += ret.html
        if (ret.json) elements.push(ret.json)
      }
    }
    else {
      const ret = processNodesInSlide(nodeKey, node[nodeKey], warpObj)
      html += ret.html
      if (ret.json) elements.push(ret.json)
    }
  }

  const json = {
    type: 'group',
    top: y - chy,
    left: x - chx,
    width: cx - chcx,
    height: cy - chcy,
    order,
    elements,
  }

  html += '</div>'

  return { html, json }
}

function processSpNode(node, warpObj) {
  const id = node['p:nvSpPr']['p:cNvPr']['attrs']['id']
  const name = node['p:nvSpPr']['p:cNvPr']['attrs']['name']
  const idx = node['p:nvSpPr']['p:nvPr']['p:ph'] ? node['p:nvSpPr']['p:nvPr']['p:ph']['attrs']['idx'] : undefined
  let type = node['p:nvSpPr']['p:nvPr']['p:ph'] ? node['p:nvSpPr']['p:nvPr']['p:ph']['attrs']['type'] : undefined
  const order = node['attrs']['order']

  let slideLayoutSpNode, slideMasterSpNode

  if (type) {
    if (idx) {
      slideLayoutSpNode = warpObj['slideLayoutTables']['typeTable'][type]
      slideMasterSpNode = warpObj['slideMasterTables']['typeTable'][type]
    } 
    else {
      slideLayoutSpNode = warpObj['slideLayoutTables']['typeTable'][type]
      slideMasterSpNode = warpObj['slideMasterTables']['typeTable'][type]
    }
  }
  else if(idx) {
    slideLayoutSpNode = warpObj['slideLayoutTables']['idxTable'][idx]
    slideMasterSpNode = warpObj['slideMasterTables']['idxTable'][idx]
  }

  if (!type) type = getTextByPathList(slideLayoutSpNode, ['p:nvSpPr', 'p:nvPr', 'p:ph', 'attrs', 'type'])
  if (!type) type = getTextByPathList(slideMasterSpNode, ['p:nvSpPr', 'p:nvPr', 'p:ph', 'attrs', 'type'])

  return genShape(node, slideLayoutSpNode, slideMasterSpNode, id, name, idx, type, order, warpObj)
}

function processCxnSpNode(node, warpObj) {
  const id = node['p:nvCxnSpPr']['p:cNvPr']['attrs']['id']
  const name = node['p:nvCxnSpPr']['p:cNvPr']['attrs']['name']
  const order = node['attrs']['order']

  return genShape(node, undefined, undefined, id, name, undefined, undefined, order, warpObj)
}

function genShape(node, slideLayoutSpNode, slideMasterSpNode, id, name, idx, type, order, warpObj) {
  const xfrmList = ['p:spPr', 'a:xfrm']
  const slideXfrmNode = getTextByPathList(node, xfrmList)
  const slideLayoutXfrmNode = getTextByPathList(slideLayoutSpNode, xfrmList)
  const slideMasterXfrmNode = getTextByPathList(slideMasterSpNode, xfrmList)

  let html = ''
  const shapType = getTextByPathList(node, ['p:spPr', 'a:prstGeom', 'attrs', 'prst'])

  const { top, left } = getPosition(slideXfrmNode, slideLayoutXfrmNode, slideMasterXfrmNode)
  const { width, height } = getSize(slideXfrmNode, slideLayoutXfrmNode, slideMasterXfrmNode)

  let isFlipV = false
  if (
    getTextByPathList(slideXfrmNode, ['attrs', 'flipV']) === '1' || 
    getTextByPathList(slideXfrmNode, ['attrs', 'flipH']) === '1'
  ) isFlipV = true

  if (shapType) {
    const ext = getTextByPathList(slideXfrmNode, ['a:ext', 'attrs'])
    const w = parseInt(ext['cx']) * 96 / 914400
    const h = parseInt(ext['cy']) * 96 / 914400

    html = `<svg class="drawing" _id="${id}" _idx="${idx}" _type="${type}" _name="${name}" style="left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: ${order};">`

    const fillColor = getShapeFill(node, true)   
    const {
      borderColor,
      borderWidth,
      borderType,
      strokeDasharray,
    } = getBorder(node, true)

    const headEndNodeAttrs = getTextByPathList(node, ['p:spPr', 'a:ln', 'a:headEnd', 'attrs'])
    const tailEndNodeAttrs = getTextByPathList(node, ['p:spPr', 'a:ln', 'a:tailEnd', 'attrs'])

    // type: none, triangle, stealth, diamond, oval, arrow
    if (
      (headEndNodeAttrs && (headEndNodeAttrs['type'] === 'triangle' || headEndNodeAttrs['type'] === 'arrow')) ||
      (tailEndNodeAttrs && (tailEndNodeAttrs['type'] === 'triangle' || tailEndNodeAttrs['type'] === 'arrow'))
    ) {
      const triangleMarker = `<defs><marker id="markerTriangle" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>`
      html += triangleMarker
    }

    switch (shapType) {
      case 'accentBorderCallout1':
      case 'accentBorderCallout2':
      case 'accentBorderCallout3':
      case 'accentCallout1':
      case 'accentCallout2':
      case 'accentCallout3':
      case 'actionButtonBackPrevious':
      case 'actionButtonBeginning':
      case 'actionButtonBlank':
      case 'actionButtonDocument':
      case 'actionButtonEnd':
      case 'actionButtonForwardNext':
      case 'actionButtonHelp':
      case 'actionButtonHome':
      case 'actionButtonInformation':
      case 'actionButtonMovie':
      case 'actionButtonReturn':
      case 'actionButtonSound':
      case 'arc':
      case 'bevel':
      case 'blockArc':
      case 'borderCallout1':
      case 'borderCallout2':
      case 'borderCallout3':
      case 'bracePair':
      case 'bracketPair':
      case 'callout1':
      case 'callout2':
      case 'callout3':
      case 'can':
      case 'chartPlus':
      case 'chartStar':
      case 'chartX':
      case 'chevron':
      case 'chord':
      case 'cloud':
      case 'cloudCallout':
      case 'corner':
      case 'cornerTabs':
      case 'cube':
      case 'decagon':
      case 'diagStripe':
      case 'diamond':
      case 'dodecagon':
      case 'donut':
      case 'doubleWave':
      case 'downArrowCallout':
      case 'ellipseRibbon':
      case 'ellipseRibbon2':
      case 'flowChartAlternateProcess':
      case 'flowChartCollate':
      case 'flowChartConnector':
      case 'flowChartDecision':
      case 'flowChartDelay':
      case 'flowChartDisplay':
      case 'flowChartDocument':
      case 'flowChartExtract':
      case 'flowChartInputOutput':
      case 'flowChartInternalStorage':
      case 'flowChartMagneticDisk':
      case 'flowChartMagneticDrum':
      case 'flowChartMagneticTape':
      case 'flowChartManualInput':
      case 'flowChartManualOperation':
      case 'flowChartMerge':
      case 'flowChartMultidocument':
      case 'flowChartOfflineStorage':
      case 'flowChartOffpageConnector':
      case 'flowChartOnlineStorage':
      case 'flowChartOr':
      case 'flowChartPredefinedProcess':
      case 'flowChartPreparation':
      case 'flowChartProcess':
      case 'flowChartPunchedCard':
      case 'flowChartPunchedTape':
      case 'flowChartSort':
      case 'flowChartSummingJunction':
      case 'flowChartTerminator':
      case 'folderCorner':
      case 'frame':
      case 'funnel':
      case 'gear6':
      case 'gear9':
      case 'halfFrame':
      case 'heart':
      case 'heptagon':
      case 'hexagon':
      case 'homePlate':
      case 'horizontalScroll':
      case 'irregularSeal1':
      case 'irregularSeal2':
      case 'leftArrow':
      case 'leftArrowCallout':
      case 'leftBrace':
      case 'leftBracket':
      case 'leftRightArrowCallout':
      case 'leftRightRibbon':
      case 'irregularSeal1':
      case 'lightningBolt':
      case 'lineInv':
      case 'mathDivide':
      case 'mathEqual':
      case 'mathMinus':
      case 'mathMultiply':
      case 'mathNotEqual':
      case 'mathPlus':
      case 'moon':
      case 'nonIsoscelesTrapezoid':
      case 'noSmoking':
      case 'octagon':
      case 'parallelogram':
      case 'pentagon':
      case 'pie':
      case 'pieWedge':
      case 'plaque':
      case 'plaqueTabs':
      case 'plus':
      case 'quadArrowCallout':
      case 'rect':
      case 'ribbon':
      case 'ribbon2':
      case 'rightArrowCallout':
      case 'rightBrace':
      case 'rightBracket':
      case 'round1Rect':
      case 'round2DiagRect':
      case 'round2SameRect':
      case 'rtTriangle':
      case 'smileyFace':
      case 'snip1Rect':
      case 'snip2DiagRect':
      case 'snip2SameRect':
      case 'snipRoundRect':
      case 'squareTabs':
      case 'star10':
      case 'star12':
      case 'star16':
      case 'star24':
      case 'star32':
      case 'star4':
      case 'star5':
      case 'star6':
      case 'star7':
      case 'star8':
      case 'sun':
      case 'teardrop':
      case 'trapezoid':
      case 'upArrowCallout':
      case 'upDownArrowCallout':
      case 'verticalScroll':
      case 'wave':
      case 'wedgeEllipseCallout':
      case 'wedgeRectCallout':
      case 'wedgeRoundRectCallout':
      case 'rect':
        html += `<rect x="0" y="0" width="${w}" height=${h} fill="${fillColor}" stroke="${borderColor}" stroke-width="${borderWidth}" stroke-dasharray="${strokeDasharray}" />`
        break
      case 'ellipse':
        html += `<ellipse cx="${(w / 2)}" cy="${(h / 2)}" rx="${(w / 2)}" ry="${(h / 2)}" fill="${fillColor}" stroke="${borderColor}" stroke-width="${borderWidth}" stroke-dasharray="${strokeDasharray}" />`
        break
      case 'roundRect':
        html += `<rect x="0" y="0" width="${w}" height="${h}" rx="7" ry="7" fill="${fillColor}" stroke="${borderColor}" stroke-width="${borderWidth}" stroke-dasharray="${strokeDasharray}" />`
        break
      case 'bentConnector2':
        const d = isFlipV ? `M 0 ${w} L ${h} ${w} L ${h} 0` : `M ${w} 0 L ${w} ${h} L 0 ${h}`
        html += `<path d="${d}" stroke="${borderColor}" stroke-width="${borderWidth}" stroke-dasharray="${strokeDasharray}" fill="none"`

        if (headEndNodeAttrs && (headEndNodeAttrs['type'] === 'triangle' || headEndNodeAttrs['type'] === 'arrow')) html += `marker-start="url(#markerTriangle)"`
        if (tailEndNodeAttrs && (tailEndNodeAttrs['type'] === 'triangle' || tailEndNodeAttrs['type'] === 'arrow')) html += `marker-end="url(#markerTriangle)"`
        html += '/>'
        break
      case 'line':
      case 'straightConnector1':
      case 'bentConnector3':
      case 'bentConnector4':
      case 'bentConnector5':
      case 'curvedConnector2':
      case 'curvedConnector3':
      case 'curvedConnector4':
      case 'curvedConnector5':
        if (isFlipV) {
          html += "<line x1='" + w + "' y1='0' x2='0' y2='" + h + "' stroke='" + borderColor + "' stroke-width='" + borderWidth + "' stroke-dasharray='" + strokeDasharray + "' "
        } 
        else {
          html += "<line x1='0' y1='0' x2='" + w + "' y2='" + h + "' stroke='" + borderColor + "' stroke-width='" + borderWidth + "' stroke-dasharray='" + strokeDasharray + "' "
        }
        if (headEndNodeAttrs && (headEndNodeAttrs['type'] === 'triangle' || headEndNodeAttrs['type'] === 'arrow')) html += `marker-start="url(#markerTriangle)"`
        if (tailEndNodeAttrs && (tailEndNodeAttrs['type'] === 'triangle' || tailEndNodeAttrs['type'] === 'arrow')) html += `marker-end="url(#markerTriangle)"`
        html += '/>'
        break
      case 'rightArrow':
        html += `<defs><marker id="markerTriangle" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="2.5" markerHeight="2.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M 0 0 L 10 5 L 0 10 Z" /></marker></defs>`
        html += `<line x1="0" y1="${(h / 2)}" x2="${(w - 15)}" y2="${(h / 2)}" stroke="${borderColor}" stroke-width="${(h / 2)}" stroke-dasharray="${strokeDasharray}"`
        html += `marker-end="url(#markerTriangle)"`
        break
      case 'downArrow':
        html += `<defs><marker id="markerTriangle" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="2.5" markerHeight="2.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M 0 0 L 10 5 L 0 10 Z" /></marker></defs>`
        html += `<line x1="${(w / 2)}" y1="0" x2="${(w / 2)}" y2="${(h - 15)}" stroke="${borderColor}" stroke-width="${(w / 2)}" stroke-dasharray="${strokeDasharray}"`
        html += `marker-end="url(#markerTriangle)"`
        break
      case 'bentArrow':
      case 'bentUpArrow':
      case 'stripedRightArrow':
      case 'quadArrow':
      case 'circularArrow':
      case 'swooshArrow':
      case 'leftRightArrow':
      case 'leftRightUpArrow':
      case 'leftUpArrow':
      case 'leftCircularArrow':
      case 'notchedRightArrow':
      case 'curvedDownArrow':
      case 'curvedLeftArrow':
      case 'curvedRightArrow':
      case 'curvedUpArrow':
      case 'upDownArrow':
      case 'upArrow':
      case 'uturnArrow':
      case 'leftRightCircularArrow':
      case 'triangle':
        break
      default:
    }

    html += '</svg>'

    const svg = html

    html += `<div class="block content ${getVerticalAlign(node, slideLayoutSpNode, slideMasterSpNode, type)}" _id="${id}" _idx="${idx}" _type="${type}" _name="${name}" style="left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: ${order};">`

    // TextBody
    let content = ''
    if (node['p:txBody']) content = genTextBody(node['p:txBody'], slideLayoutSpNode, slideMasterSpNode, type, warpObj)
    html += content
    html += '</div>'

    const json = {
      type: 'shape',
      left,
      top,
      width,
      height,
      order,
      borderColor,
      borderWidth,
      borderType,
      fillColor,
      content,
      svg,
    }
    return { html, json }
  } 
  else {
    const {
      borderColor,
      borderWidth,
      borderType,
    } = getBorder(node, false)
    const fillColor = getShapeFill(node, false)
    html += `<div class="block content ${getVerticalAlign(node, slideLayoutSpNode, slideMasterSpNode, type)}" _id="${id}" _idx="${idx}" _type="${type}" _name="${name}" style="left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; border: ${borderWidth}px ${borderType} ${borderColor}; background-color: ${fillColor}; z-index: ${order};">`

    // TextBody
    let content = ''
    if (node['p:txBody']) content = genTextBody(node['p:txBody'], slideLayoutSpNode, slideMasterSpNode, type, warpObj)
    html += content
    html += '</div>'

    const json = {
      type: 'text',
      left,
      top,
      width,
      height,
      order,
      borderColor,
      borderWidth,
      borderType,
      fillColor,
      content,
    }
    return { html, json }
  }
}

function processPicNode(node, warpObj) {
  const order = node['attrs']['order']

  const rid = node['p:blipFill']['a:blip']['attrs']['r:embed']
  const imgName = warpObj['slideResObj'][rid]['target']
  const imgFileExt = extractFileExtension(imgName).toLowerCase()
  const zip = warpObj["zip"]
  const imgArrayBuffer = zip.file(imgName).asArrayBuffer()
  const xfrmNode = node['p:spPr']['a:xfrm']
  let mimeType = ''

  switch (imgFileExt) {
    case 'jpg':
    case 'jpeg':
      mimeType = 'image/jpeg'
      break
    case 'png':
      mimeType = 'image/png'
      break
    case 'gif':
      mimeType = 'image/gif'
      break
    case 'emf':
      mimeType = 'image/x-emf'
      break
    case 'wmf':
      mimeType = 'image/x-wmf'
      break
    default:
      mimeType = 'image/*'
  }
  const { top, left } = getPosition(xfrmNode, undefined, undefined)
  const { width, height } = getSize(xfrmNode, undefined, undefined)
  const src = `data:${mimeType};base64,${base64ArrayBuffer(imgArrayBuffer)}`

  const json = {
    type: 'image',
    top,
    left,
    width, 
    height,
    order,
    src,
  }

  const html = `<div class="block content" style="left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: ${order};"><img src="${src}" style="width: 100%; height: 100%;" /></div>`

  return { html, json }
}

function processGraphicFrameNode(node, warpObj) {
  const graphicTypeUri = getTextByPathList(node, ['a:graphic', 'a:graphicData', 'attrs', 'uri'])
  
  let result
  switch (graphicTypeUri) {
    case 'http://schemas.openxmlformats.org/drawingml/2006/table':
      result = genTable(node, warpObj)
      break
    case 'http://schemas.openxmlformats.org/drawingml/2006/chart':
      result = genChart(node, warpObj)
      break
    case 'http://schemas.openxmlformats.org/drawingml/2006/diagram':
      result = genDiagram(node, warpObj)
      break
    default:
  }
  return result
}

function genTextBody(textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, warpObj) {

  let text = ''
  const slideMasterTextStyles = warpObj['slideMasterTextStyles']

  if (!textBodyNode) return text

  if (textBodyNode['a:p'].constructor === Array) {
    for (const pNode of textBodyNode['a:p']) {
      const rNode = pNode['a:r']
      text += `<div class="${getHorizontalAlign(pNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles)}">`
      text += genBuChar(pNode)
      if (!rNode) text += genSpanElement(pNode, slideLayoutSpNode, slideMasterSpNode, type, warpObj)
      else if (rNode.constructor === Array) {
        for (const rNodeItem of rNode) text += genSpanElement(rNodeItem, slideLayoutSpNode, slideMasterSpNode, type, warpObj)
      } 
      else text += genSpanElement(rNode, slideLayoutSpNode, slideMasterSpNode, type, warpObj)
      text += '</div>'
    }
  } 
  else {
    const pNode = textBodyNode['a:p']
    const rNode = pNode['a:r']
    text += `<div class="${getHorizontalAlign(pNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles)}">`
    text += genBuChar(pNode)
    if (!rNode) text += genSpanElement(pNode, slideLayoutSpNode, slideMasterSpNode, type, warpObj)
    else if (rNode.constructor === Array) {
      for (const rNodeItem of rNode) text += genSpanElement(rNodeItem, slideLayoutSpNode, slideMasterSpNode, type, warpObj)
    } 
    else text += genSpanElement(rNode, slideLayoutSpNode, slideMasterSpNode, type, warpObj)
    text += '</div>'
  }
  return text
}

function genBuChar(node) {
  const pPrNode = node['a:pPr']

  let lvl = parseInt(getTextByPathList(pPrNode, ['attrs', 'lvl']))
  if (isNaN(lvl)) lvl = 0

  const buChar = getTextByPathList(pPrNode, ['a:buChar', 'attrs', 'char'])
  if (buChar) {
    const buFontAttrs = getTextByPathList(pPrNode, ['a:buFont', 'attrs'])

    if (buFontAttrs) {
      let marginLeft = parseInt(getTextByPathList(pPrNode, ['attrs', 'marL'])) * 96 / 914400
      let marginRight = parseInt(buFontAttrs['pitchFamily'])

      if (isNaN(marginLeft)) marginLeft = 328600 * 96 / 914400
      if (isNaN(marginRight)) marginRight = 0

      const typeface = buFontAttrs['typeface']

      return `<span style="font-family: ${typeface}; margin-left: ${marginLeft * lvl}px; margin-right: ${marginRight}px; font-size: 20pt;">${buChar}</span>`
    } 
    else {
      marginLeft = 328600 * 96 / 914400 * lvl
      return `<span style="margin-left: ${marginLeft}px;">${buChar}</span>`
    }
  }
  return `<span style="margin-left: ${328600 * 96 / 914400 * lvl}px; margin-right: 0;"></span>`
}

function genSpanElement(node, slideLayoutSpNode, slideMasterSpNode, type, warpObj) {
  const slideMasterTextStyles = warpObj['slideMasterTextStyles']

  let text = node['a:t']
  if (typeof text !== 'string') text = getTextByPathList(node, ['a:fld', 'a:t'])
  if (typeof text !== 'string') text = '&nbsp;'

  const styleText = `
    color: ${getFontColor(node, type, slideMasterTextStyles)};
    font-size: ${getFontSize(node, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles)};
    font-family: ${getFontType(node, type, slideMasterTextStyles)};
    font-weight: ${getFontBold(node, type, slideMasterTextStyles)};
    font-style: ${getFontItalic(node, type, slideMasterTextStyles)};
    text-decoration: ${getFontDecoration(node, type, slideMasterTextStyles)};
    vertical-align: ${getTextVerticalAlign(node, type, slideMasterTextStyles)};
  `

  const linkID = getTextByPathList(node, ['a:rPr', 'a:hlinkClick', 'attrs', 'r:id'])
  if (linkID) {
    const linkURL = warpObj['slideResObj'][linkID]['target']
    return `<span class="text-block" style="${styleText}"><a href="${linkURL}" target="_blank">${text.replace(/\s/i, '&nbsp;')}</a></span>`
  } 
  return `<span class="text-block" style="${styleText}">${text.replace(/\s/i, '&nbsp;')}</span>`
}

function genTable(node, warpObj) {
  const order = node['attrs']['order']
  const tableNode = getTextByPathList(node, ['a:graphic', 'a:graphicData', 'a:tbl'])
  const xfrmNode = getTextByPathList(node, ['p:xfrm'])
  const { top, left } = getPosition(xfrmNode, undefined, undefined)
  const { width, height } = getSize(xfrmNode, undefined, undefined)
  
  let html = `<table style="left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: ${order};">`

  const trNodes = tableNode['a:tr']
  
  const data = []
  if (trNodes.constructor === Array) {
    for (const trNode of trNodes) {
      html += '<tr>'
      const tcNodes = trNode['a:tc']
      const tr = []

      if (tcNodes.constructor === Array) {
        for (const tcNode of tcNodes) {
          const text = genTextBody(tcNode['a:txBody'], undefined, undefined, undefined, warpObj)
          const rowSpan = getTextByPathList(tcNode, ['attrs', 'rowSpan'])
          const colSpan = getTextByPathList(tcNode, ['attrs', 'gridSpan'])
          const vMerge = getTextByPathList(tcNode, ['attrs', 'vMerge'])
          const hMerge = getTextByPathList(tcNode, ['attrs', 'hMerge'])

          if (rowSpan) html += `<td rowspan="${parseInt(rowSpan)}">${text}</td>`
          else if (colSpan) html += `<td colspan="${parseInt(colSpan)}">${text}</td>`
          else if (!vMerge && !hMerge) html += `<td>${text}</td>`

          tr.push({ text, rowSpan, colSpan, vMerge, hMerge })
        }
      } 
      else {
        const text = genTextBody(tcNodes['a:txBody'])
        html += `<td>${text}</td>`

        tr.push({ text })
      }
      html += '</tr>'

      data.push(tr)
    }
  } 
  else {
    html += '<tr>'
    const tcNodes = trNodes['a:tc']
    const tr = []

    if (tcNodes.constructor === Array) {
      for (const tcNode of tcNodes) {
        const text = genTextBody(tcNode['a:txBody'])
        html += `<td>${text}</td>`

        tr.push({ text })
      }
    } 
    else {
      const text = genTextBody(tcNodes['a:txBody'])
      html += `<td>${text}</td>`

      tr.push({ text })
    }
    html += '</tr>'

    data.push(tr)
  }

  const json = {
    type: 'table',
    top,
    left,
    width,
    height,
    order,
    data,
  }

  return { html, json }
}

function genChart(node, warpObj) {
  const chartID = '' + Math.floor(Math.random() * 10000000)
  const order = node['attrs']['order']
  const xfrmNode = getTextByPathList(node, ['p:xfrm'])
  const { top, left } = getPosition(xfrmNode, undefined, undefined)
  const { width, height } = getSize(xfrmNode, undefined, undefined)
  const html = `<div id="chart${chartID}" class="block content" style="left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: ${order};"></div>`

  const rid = node['a:graphic']['a:graphicData']['c:chart']['attrs']['r:id']
  const refName = warpObj['slideResObj'][rid]['target']
  const content = readXmlFile(warpObj['zip'], refName)
  const plotArea = getTextByPathList(content, ['c:chartSpace', 'c:chart', 'c:plotArea'])

  let chartData = null
  for (const key in plotArea) {
    switch (key) {
      case 'c:lineChart':
        chartData = {
          chartID: 'chart' + chartID,
          chartType: 'lineChart',
          chartData: extractChartData(plotArea[key]['c:ser']),
        }
        break
      case 'c:barChart':
        chartData = {
          chartID: 'chart' + chartID,
          chartType: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']) === 'stacked' ? 'stackedBarChart' : 'barChart',
          chartData: extractChartData(plotArea[key]['c:ser']),
        }
        break
      case 'c:pieChart':
        chartData = {
          chartID: 'chart' + chartID,
          chartType: 'pieChart',
          chartData: extractChartData(plotArea[key]['c:ser']),
        }
        break
      case 'c:pie3DChart':
        chartData = {
          chartID: 'chart' + chartID,
          chartType: 'pie3DChart',
          chartData: extractChartData(plotArea[key]['c:ser']),
        }
        break
      case 'c:areaChart':
        chartData = {
          chartID: 'chart' + chartID,
          chartType: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']) === 'percentStacked' ? 'stackedAreaChart' : 'areaChart',
          chartData: extractChartData(plotArea[key]['c:ser']),
        }
        break
      case 'c:scatterChart':
        chartData = {
          chartID: 'chart' + chartID,
          chartType: 'scatterChart',
          chartData: extractChartData(plotArea[key]['c:ser']),
        }
        break
      case 'c:catAx':
        break
      case 'c:valAx':
        break
      default:
    }
  }

  if (chartData) chartList.push(chartData)

  let json = {}
  if (chartData) {
    json = {
      type: 'chart',
      top,
      left,
      width,
      height,
      order,
      data: chartData.chartData,
    }
  }

  return { html, json }
}

function genDiagram(node, warpObj) {
  const order = node['attrs']['order']
  const xfrmNode = getTextByPathList(node, ['p:xfrm'])
  const { left, top } = getPosition(xfrmNode, undefined, undefined)
  const { width, height } = getSize(xfrmNode, undefined, undefined)

  const json = {
    type: 'diagram',
    left,
    top,
    width,
    height,
    order,
  }

  const html = `<div class="block content" style="border: 1px dotted; z-index: ${order}; left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px;">TODO: diagram</div>`

  return { html, json }
}

function getPosition(slideSpNode, slideLayoutSpNode, slideMasterSpNode) {
  let off

  if (slideSpNode) off = slideSpNode['a:off']['attrs']
  else if (slideLayoutSpNode) off = slideLayoutSpNode['a:off']['attrs']
  else if (slideMasterSpNode) off = slideMasterSpNode['a:off']['attrs']

  if (!off) return { top: 0, left: 0 }

  return {
    top: parseInt(off['y']) * 96 / 914400,
    left: parseInt(off['x']) * 96 / 914400,
  }
}

function getSize(slideSpNode, slideLayoutSpNode, slideMasterSpNode) {
  let ext

  if (slideSpNode) ext = slideSpNode['a:ext']['attrs']
  else if (slideLayoutSpNode) ext = slideLayoutSpNode['a:ext']['attrs']
  else if (slideMasterSpNode) ext = slideMasterSpNode['a:ext']['attrs']

  if (!ext) return { width: 0, height: 0 }

  return {
    width: parseInt(ext['cx']) * 96 / 914400,
    height: parseInt(ext['cy']) * 96 / 914400,
  }
}

function getHorizontalAlign(node, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles) {
  let algn = getTextByPathList(node, ['a:pPr', 'attrs', 'algn'])

  if (!algn) algn = getTextByPathList(slideLayoutSpNode, ['p:txBody', 'a:p', 'a:pPr', 'attrs', 'algn'])
  if (!algn) algn = getTextByPathList(slideMasterSpNode, ['p:txBody', 'a:p', 'a:pPr', 'attrs', 'algn'])
  if (!algn) {
    switch (type) {
      case 'title':
      case 'subTitle':
      case 'ctrTitle':
        algn = getTextByPathList(slideMasterTextStyles, ['p:titleStyle', 'a:lvl1pPr', 'attrs', 'alng'])
        break
      default:
        algn = getTextByPathList(slideMasterTextStyles, ['p:otherStyle', 'a:lvl1pPr', 'attrs', 'alng'])
    }
  }
  if (!algn) {
    if (type == 'title' || type == 'subTitle' || type == 'ctrTitle') return 'h-mid'
    else if (type == 'sldNum') return 'h-right'
  }
  return algn === 'ctr' ? 'h-mid' : algn === 'r' ? 'h-right' : 'h-left'
}

function getVerticalAlign(node, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles) {
  let anchor = getTextByPathList(node, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor'])

  if (!anchor) anchor = getTextByPathList(slideLayoutSpNode, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor'])
  if (!anchor) anchor = getTextByPathList(slideMasterSpNode, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor'])

  return anchor === 'ctr' ? 'v-mid' : anchor === 'b' ? 'v-down' : 'v-up'
}

function getFontType(node, type, slideMasterTextStyles) {
  let typeface = getTextByPathList(node, ['a:rPr', 'a:latin', 'attrs', 'typeface'])

  if (!typeface) {
    const fontSchemeNode = getTextByPathList(themeContent, ['a:theme', 'a:themeElements', 'a:fontScheme'])

    if (type == 'title' || type == 'subTitle' || type == 'ctrTitle') {
      typeface = getTextByPathList(fontSchemeNode, ['a:majorFont', 'a:latin', 'attrs', 'typeface'])
    } 
    else if (type == 'body') {
      typeface = getTextByPathList(fontSchemeNode, ['a:minorFont', 'a:latin', 'attrs', 'typeface'])
    } 
    else {
      typeface = getTextByPathList(fontSchemeNode, ['a:minorFont', 'a:latin', 'attrs', 'typeface'])
    }
  }

  return typeface || 'inherit'
}

function getFontColor(node, type, slideMasterTextStyles) {
  const color = getTextByPathStr(node, 'a:rPr a:solidFill a:srgbClr attrs val')
  return color ? `#${color}` : '#000'
}

function getFontSize(node, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles) {
  let fontSize

  if (node['a:rPr']) fontSize = parseInt(node['a:rPr']['attrs']['sz']) / 100

  if ((isNaN(fontSize) || !fontSize)) {
    const sz = getTextByPathList(slideLayoutSpNode, ['p:txBody', 'a:lstStyle', 'a:lvl1pPr', 'a:defRPr', 'attrs', 'sz'])
    fontSize = parseInt(sz) / 100
  }

  if (isNaN(fontSize) || !fontSize) {
    let sz
    if (type === 'title' || type === 'subTitle' || type === 'ctrTitle') {
      sz = getTextByPathList(slideMasterTextStyles, ['p:titleStyle', 'a:lvl1pPr', 'a:defRPr', 'attrs', 'sz'])
    } 
    else if (type === 'body') {
      sz = getTextByPathList(slideMasterTextStyles, ['p:bodyStyle', 'a:lvl1pPr', 'a:defRPr', 'attrs', 'sz'])
    } 
    else if (type === 'dt' || type === 'sldNum') {
      sz = '1200'
    } 
    else if (!type) {
      sz = getTextByPathList(slideMasterTextStyles, ['p:otherStyle', 'a:lvl1pPr', 'a:defRPr', 'attrs', 'sz'])
    }
    if (sz) fontSize = parseInt(sz) / 100
  }

  const baseline = getTextByPathList(node, ['a:rPr', 'attrs', "baseline"])
  if (baseline && !isNaN(fontSize)) fontSize -= 10

  return (isNaN(fontSize) || !fontSize) ? 'inherit' : (fontSize + 'pt')
}

function getFontBold(node, type, slideMasterTextStyles) {
  return (node['a:rPr'] && node['a:rPr']['attrs']['b'] === '1') ? 'bold' : 'initial'
}

function getFontItalic(node, type, slideMasterTextStyles) {
  return (node['a:rPr'] && node['a:rPr']['attrs']['i'] === '1') ? 'italic' : 'normal'
}

function getFontDecoration(node, type, slideMasterTextStyles) {
  return (node['a:rPr'] && node['a:rPr']['attrs']['u'] === 'sng') ? 'underline' : 'initial'
}

function getTextVerticalAlign(node, type, slideMasterTextStyles) {
  const baseline = getTextByPathList(node, ['a:rPr', 'attrs', 'baseline'])
  return baseline ? (parseInt(baseline) / 1000) + '%' : 'baseline'
}

function getBorder(node, isSvgMode) {
  // 1. presentationML
  const lineNode = node['p:spPr']['a:ln']

  // Border width: 1pt = 12700, default = 0.75pt
  let borderWidth = parseInt(getTextByPathList(lineNode, ['attrs', 'w'])) / 12700
  if (isNaN(borderWidth)) borderWidth = 0

  // Border color
  let borderColor = getTextByPathList(lineNode, ['a:solidFill', 'a:srgbClr', 'attrs', 'val'])
  if (!borderColor) {
    const schemeClrNode = getTextByPathList(lineNode, ['a:solidFill', 'a:schemeClr'])
    const schemeClr = 'a:' + getTextByPathList(schemeClrNode, ['attrs', 'val'])
    borderColor = getSchemeColorFromTheme(schemeClr)
  }

  // 2. drawingML namespace
  if (!borderColor) {
    const schemeClrNode = getTextByPathList(node, ['p:style', 'a:lnRef', 'a:schemeClr'])
    const schemeClr = 'a:' + getTextByPathList(schemeClrNode, ['attrs', 'val'])
    borderColor = getSchemeColorFromTheme(schemeClr)

    if (borderColor) {
      let shade = getTextByPathList(schemeClrNode, ['a:shade', 'attrs', 'val'])

      if (shade) {
        shade = parseInt(shade) / 100000
        
        const color = tinycolor('#' + borderColor).toHsl()
        borderColor = tinycolor({ h: color.h, s: color.s, l: color.l * shade, a: color.a }).toHex()
      }
    }
  }

  if (!borderColor) {
    if (isSvgMode) borderColor = 'none'
    else borderColor = '#000'
  } 
  else {
    borderColor = `#${borderColor}`
  }

  // Border type
  const type = getTextByPathList(lineNode, ['a:prstDash', 'attrs', 'val'])
  let borderType = 'solid'
  let strokeDasharray = '0'
  switch (type) {
    case 'solid':
      borderType = 'solid'
      strokeDasharray = '0'
      break
    case 'dash':
      borderType = 'dashed'
      strokeDasharray = '5'
      break
    case 'dashDot':
      borderType = 'dashed'
      strokeDasharray = '5, 5, 1, 5'
      break
    case 'dot':
      borderType = 'dotted'
      strokeDasharray = '1, 5'
      break
    case 'lgDash':
      borderType = 'dashed'
      strokeDasharray = '10, 5'
      break
    case 'lgDashDotDot':
      borderType = 'dashed'
      strokeDasharray = '10, 5, 1, 5, 1, 5'
      break
    case 'sysDash':
      borderType = 'dashed'
      strokeDasharray = '5, 2'
      break
    case 'sysDashDot':
      borderType = 'dashed'
      strokeDasharray = '5, 2, 1, 5'
      break
    case 'sysDashDotDot':
      borderType = 'dashed'
      strokeDasharray = '5, 2, 1, 5, 1, 5'
      break
    case 'sysDot':
      borderType = 'dotted'
      strokeDasharray = '2, 5'
      break
    default:
  }

  return {
    borderColor,
    borderWidth,
    borderType,
    strokeDasharray,
  }
}

function getSlideBackgroundFill(slideContent, slideLayoutContent, slideMasterContent) {
  let bgColor = getSolidFill(getTextByPathList(slideContent, ['p:sld', 'p:cSld', 'p:bg', 'p:bgPr', 'a:solidFill']))
  if (!bgColor) bgColor = getSolidFill(getTextByPathList(slideLayoutContent, ['p:sldLayout', 'p:cSld', 'p:bg', 'p:bgPr', 'a:solidFill']))
  if (!bgColor) bgColor = getSolidFill(getTextByPathList(slideMasterContent, ['p:sldMaster', 'p:cSld', 'p:bg', 'p:bgPr', 'a:solidFill']))
  if (!bgColor) bgColor = 'fff'
  return bgColor
}

function getShapeFill(node, isSvgMode) {

  // 1. presentationML
  // p:spPr [a:noFill, solidFill, gradFill, blipFill, pattFill, grpFill]
  // From slide
  if (getTextByPathList(node, ['p:spPr', 'a:noFill'])) {
    return isSvgMode ? 'none' : 'background-color: initial;'
  }

  let fillColor
  if (!fillColor) {
    fillColor = getTextByPathList(node, ['p:spPr', 'a:solidFill', 'a:srgbClr', 'attrs', 'val'])
  }

  // From theme
  if (!fillColor) {
    const schemeClr = 'a:' + getTextByPathList(node, ['p:spPr', 'a:solidFill', 'a:schemeClr', 'attrs', 'val'])
    fillColor = getSchemeColorFromTheme(schemeClr)
  }

  // 2. drawingML namespace
  if (!fillColor) {
    const schemeClr = 'a:' + getTextByPathList(node, ['p:style', 'a:fillRef', 'a:schemeClr', 'attrs', 'val'])
    fillColor = getSchemeColorFromTheme(schemeClr)
  }

  if (fillColor) {
    fillColor = `#${fillColor}`

    // Apply shade or tint
    // TODO: 較淺, 較深 80%
    let lumMod = parseInt(getTextByPathList(node, ['p:spPr', 'a:solidFill', 'a:schemeClr', 'a:lumMod', 'attrs', 'val'])) / 100000
    let lumOff = parseInt(getTextByPathList(node, ['p:spPr', 'a:solidFill', 'a:schemeClr', 'a:lumOff', 'attrs', 'val'])) / 100000
    if (isNaN(lumMod)) lumMod = 1.0
    if (isNaN(lumOff)) lumOff = 0
    fillColor = applyLumModify(fillColor, lumMod, lumOff)

    return fillColor
  } 
  else {
    if (isSvgMode) return 'none'
    return fillColor
  }
}

function getSolidFill(solidFill) {
  if (!solidFill) return solidFill

  let color = 'fff'

  if (solidFill['a:srgbClr']) {
    color = getTextByPathList(solidFill['a:srgbClr'], ['attrs', 'val'])
  } 
  else if (solidFill['a:schemeClr']) {
    const schemeClr = 'a:' + getTextByPathList(solidFill['a:schemeClr'], ['attrs', 'val'])
    color = getSchemeColorFromTheme(schemeClr)
  }

  return color
}

function getSchemeColorFromTheme(schemeClr) {
  // TODO: <p:clrMap ...> in slide master
  // e.g. tx2="dk2" bg2="lt2" tx1="dk1" bg1="lt1"
  switch (schemeClr) {
    case 'a:tx1':
      schemeClr = 'a:dk1'
      break
    case 'a:tx2':
      schemeClr = 'a:dk2'
      break
    case 'a:bg1':
      schemeClr = 'a:lt1'
      break
    case 'a:bg2':
      schemeClr = 'a:lt2'
      break
  }
  const refNode = getTextByPathList(themeContent, ['a:theme', 'a:themeElements', 'a:clrScheme', schemeClr])
  let color = getTextByPathList(refNode, ['a:srgbClr', 'attrs', 'val'])
  if (!color) color = getTextByPathList(refNode, ['a:sysClr', 'attrs', 'lastClr'])
  return color
}

function extractChartData(serNode) {
  const dataMat = []
  if (!serNode) return dataMat

  if (serNode['c:xVal']) {
    let dataRow = []
    eachElement(serNode['c:xVal']['c:numRef']['c:numCache']['c:pt'], function (innerNode, index) {
      dataRow.push(parseFloat(innerNode['c:v']))
      return ''
    })
    dataMat.push(dataRow)
    dataRow = []
    eachElement(serNode['c:yVal']['c:numRef']['c:numCache']['c:pt'], function (innerNode, index) {
      dataRow.push(parseFloat(innerNode['c:v']))
      return ''
    })
    dataMat.push(dataRow)
  } 
  else {
    eachElement(serNode, function (innerNode, index) {
      const dataRow = []
      const colName = getTextByPathList(innerNode, ['c:tx', 'c:strRef', 'c:strCache', 'c:pt', 'c:v']) || index

      // Category (string or number)
      const rowNames = {}
      if (getTextByPathList(innerNode, ['c:cat', 'c:strRef', 'c:strCache', 'c:pt'])) {
        eachElement(innerNode['c:cat']['c:strRef']['c:strCache']['c:pt'], function (innerNode, index) {
          rowNames[innerNode['attrs']['idx']] = innerNode['c:v']
          return ''
        })
      } 
      else if (getTextByPathList(innerNode, ['c:cat', 'c:numRef', 'c:numCache', 'c:pt'])) {
        eachElement(innerNode['c:cat']['c:numRef']['c:numCache']['c:pt'], function (innerNode, index) {
          rowNames[innerNode['attrs']['idx']] = innerNode['c:v']
          return ''
        })
      }

      // Value
      if (getTextByPathList(innerNode, ['c:val', 'c:numRef', 'c:numCache', 'c:pt'])) {
        eachElement(innerNode['c:val']['c:numRef']['c:numCache']['c:pt'], function (innerNode, index) {
          dataRow.push({
            x: innerNode['attrs']['idx'],
            y: parseFloat(innerNode['c:v']),
          })
          return ''
        })
      }

      dataMat.push({
        key: colName,
        values: dataRow,
        xlabels: rowNames,
      })
      return ''
    })
  }

  return dataMat
}

function getTextByPathStr(node, pathStr) {
  return getTextByPathList(node, pathStr.trim().split(/\s+/))
}

function getTextByPathList(node, path) {
  if (path.constructor !== Array) throw Error('Error of path type! path is not array.')

  if (!node) return node

  for (let i = 0; i < path.length; i++) {
    node = node[path[i]]
    if (!node) return node
  }

  return node
}

function eachElement(node, doFunction) {
  if (!node) return node

  let result = ''
  if (node.constructor === Array) {
    for (let i = 0; i < node.length; i++) {
      result += doFunction(node[i], i)
    }
  } 
  else result += doFunction(node, 0)

  return result
}

function applyLumModify(rgbStr, factor, offset) {
  const color = tinycolor(rgbStr).toHsl()
  const lum = color.l * (1 + offset)
  return tinycolor({ h: color.h, s: color.s, l: lum, a: color.a }).toHexString()
}

function base64ArrayBuffer(arrayBuffer) {
	let base64 = ''
	const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	const bytes = new Uint8Array(arrayBuffer)
	const byteLength = bytes.byteLength
	const byteRemainder = byteLength % 3
	const mainLength = byteLength - byteRemainder

	let a, b, c, d
	let chunk

	for (let i = 0; i < mainLength; i = i + 3) {
		chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
		a = (chunk & 16515072) >> 18
		b = (chunk & 258048) >> 12
		c = (chunk & 4032) >>  6
		d = chunk & 63
		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
	}

	if (byteRemainder == 1) {
		chunk = bytes[mainLength]
		a = (chunk & 252) >> 2
		b = (chunk & 3) << 4
		base64 += encodings[a] + encodings[b] + '=='
	} 
  else if (byteRemainder == 2) {
		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
		a = (chunk & 64512) >> 10
		b = (chunk & 1008) >> 4
		c = (chunk & 15) << 2
		base64 += encodings[a] + encodings[b] + encodings[c] + '='
	}

	return base64
}

function extractFileExtension(filename) {
	return filename.substr((~-filename.lastIndexOf(".") >>> 0) + 2)
}