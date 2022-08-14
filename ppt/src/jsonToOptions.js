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
        const dom = template.content.lastChild.lastChild;
        const fontSize = parseInt(dom.style.fontSize)
        if(fontSize  > maxfontsize ) {
          maxfontsize = fontSize;
          option.context += option.title;
          option.title = dom.textContent;
          
        } else {
          option.context += dom.textContent
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
