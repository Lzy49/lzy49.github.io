function itemToOption(json) {
  const options = [];
  json.forEach((page) => {
    const option = {
      title: "",
      context: "",
      img: [],
    };
    let maxfontsize = 0;
    for(const item of page.elements){
      if (item.type === "text") {
        let template = document.createElement('template');
        template.innerHTML =  item.content;
        const nodes = template.content.lastChild.childNodes;
        for( const dom of Array.from(nodes)) {
          const fontSize = parseInt(dom.style.fontSize)
          // 同样字体大小的是标题
          if(fontSize === maxfontsize) {
            option.title += dom.textContent;
          }
          // 如果有更大字体则替换旧的标题
          if(fontSize  > maxfontsize ) {
            maxfontsize = fontSize;
            option.context += option.title;
            option.title = dom.textContent;
          } else {
            // 其他都是内容
            option.context += dom.textContent
          }
        }
      }
      if (item.type === "image") {
        option.img.push(item.src);
      }
    }
    options.push(option)
  });
  console.log(options);
}
