const fileSelectorButton = document.getElementById("filebutton")
const fileSelectorInput = document.getElementById("fileselect")

var selectedFile = null;

fileSelectorButton.addEventListener("click", function(){
  fileSelectorInput.click()
})

fileSelectorInput.addEventListener("change", function(){
  if(this.files && this.files[0]){
    console.log("got file!")
    console.log(this.files[0])
    selectedFile = this.files[0]

    createImg(selectedFile)

    loadCreatorInterface()
  }
})

function loadCreatorInterface(){
  document.getElementById("openimg").classList.add("hidden")
  document.getElementById("creator").classList.remove("hidden")

}

function createImg(file){
  let reader = new FileReader();

  reader.onload = function(e){
    let image = document.createElement("img")
    image.src = e.target.result
    image.id  = "image"

    image.addEventListener("load", function(){
      createCanvasOnImage()
    })

    document.getElementById("imgviewer").appendChild(image)
  }

  reader.readAsDataURL(file)
}

function createCanvasOnImage(){
  var canvas = document.createElement("canvas")
  canvas.width = document.getElementById("image").width
  canvas.height = document.getElementById("image").height

  document.getElementById("imgviewer").appendChild(canvas)

  createCanvasContext(canvas)
}

function createCanvasContext(canvas){
  var CTX = canvas.getContext("2d")

  // Canvas INIT
  canvas.addEventListener("mousemove", updateMousePosition)
  canvas.addEventListener("click", interfaceImageClick)


  const FPS = 1000 / 60  // 60fps
  let interval = setInterval(function(){
    // Canvas LOOP
    CTX.clearRect(0, 0, canvas.width, canvas.height)

    if(select_status == "RECTSELECT"){
      plotPoint(CTX, mouseClickStorage[0], mouseClickStorage[1])
      plotPoint(CTX, mousePosition[0], mousePosition[1])

      CTX.strokeStyle = "#ff0000"
      CTX.strokeRect(
        mouseClickStorage[0],
        mouseClickStorage[1],
        mousePosition[0] - mouseClickStorage[0],
        mousePosition[1] - mouseClickStorage[1]
      )
    }

    if(select_status == "CIRCLESELECT"){
      CTX.beginPath()
      CTX.strokeStyle = "#ff0000"
      CTX.arc(
        mouseClickStorage[0], mouseClickStorage[1],
        getDistanceFromStorage(),
        0, 2*Math.PI
      )
      CTX.stroke()
      CTX.closePath()

      CTX.beginPath()
      CTX.moveTo(mouseClickStorage[0], mouseClickStorage[1])
      CTX.lineTo(mousePosition[0], mousePosition[1])
      CTX.stroke()
      CTX.closePath()

      plotPoint(CTX, mouseClickStorage[0], mouseClickStorage[1])
      plotPoint(CTX, mousePosition[0], mousePosition[1])
    }

    if(select_status == "POLYSELECT"){
      if(polyPath.length > 0){
        CTX.beginPath()
        CTX.moveTo(polyPath[0][0], polyPath[0][1])
      }
      for(let i=0; i<polyPath.length; i++){
        CTX.strokeStyle = "#000000"
        CTX.fillStyle = "#88ff88"
        plotPoint(CTX, polyPath[i][0], polyPath[i][1])
        if(polyPath.length < 2) continue;
        CTX.lineTo(polyPath[i][0], polyPath[i][1])
      }
      if(polyPath.length > 0){
        CTX.stroke();
        CTX.closePath()
      }
    }

    if(select_status == "VERTICECREATE" || select_status == "POLYSELECT"){
      CTX.fillStyle = "#aaaaff"
      CTX.strokeStyle = "#000000"
      for(let i=0; i<polyVertices.length; i++){
        plotPoint(CTX, polyVertices[i][0], polyVertices[i][1], 3, false)
      }
    }

    if(select_status == "VERTICEREMOVE"){
      CTX.fillStyle = "#ffaaaa"
      CTX.strokeStyle = "#000000"
      for(let i=0; i<polyVertices.length; i++){
        if(closeMouseToVertice() == i) {
          CTX.fillStyle = "#ffffaa"
        } else {
          CTX.fillStyle = "#ffaaaa"
        }
        plotPoint(CTX, polyVertices[i][0], polyVertices[i][1], 3, false)
      }
    }

    if(drawAreaIndex != -1){
      switch(imageAreas[drawAreaIndex].type){
        case "rect":
          ctx.fillRect(
            imageAreas[drawAreaIndex].pos[0][0],
            imageAreas[drawAreaIndex].pos[0][1],
            imageAreas[drawAreaIndex].pos[1][0] - imageAreas[drawAreaIndex].pos[0][0],
            imageAreas[drawAreaIndex].pos[1][1] - imageAreas[drawAreaIndex].pos[0][1],
          )
          break;
        case "circle":
          drawCircle(CTX, drawAreaIndex)
          break;
        case "poly":
          drawPolygon(CTX, drawAreaIndex)
          break;
      }
    }

  }, FPS)
}

function drawCircle(ctx, index){
  if(imageAreas[index].type != "circle") return
  ctx.beginPath()
  ctx.strokeStyle = "#000000"
  ctx.fillStyle = "#88ff88"
  ctx.arc(imageAreas[index].pos[0], imageAreas[index].pos[1], imageAreas[index].radius, 0, 2*Math.PI)
  ctx.fill()
  ctx.stroke()
  ctx.closePath()
}

function drawPolygon(ctx, index){
  if(imageAreas[index].type != "poly") return
  ctx.beginPath()
  ctx.moveTo(imageAreas[index].path[0][0], imageAreas[index].path[0][1])
  for(let i=0; i<imageAreas[index].path.length; i++){
    ctx.strokeStyle = "#000000"
    ctx.fillStyle = "#88ff8800"
    // plotPoint(ctx, imageAreas[index].path[i][0], imageAreas[index].path[i][1])
    if(polyPath.length < 2) continue;
    ctx.lineTo(imageAreas[index].path[i][0], imageAreas[index].path[i][1])
  }
  ctx.stroke()
  ctx.fill()
  ctx.closePath()
}

// distance from stored point and mousepos
function getDistanceFromStorage(){
  return Math.floor(Math.sqrt((mouseClickStorage[0] - mousePosition[0])**2 + (mouseClickStorage[1] - mousePosition[1])**2))
}

function plotPoint(ctx, x, y, radius=5, text=true){
  // console.log(ctx, x, y)
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2*Math.PI)
  ctx.stroke()
  ctx.fill()
  ctx.closePath();

  if(text)ctx.fillText(`{${x}, ${y}}`, x, y)
}


var imageAreas   = []
var polyVertices = []
var polyPath     = []
var polyStart    = null;

var mousePosition = []
var mouseClickStorage = null

var drawAreaIndex = -1

var select_status = ""

// get vertice index which mouse is close enough to
function closeMouseToVertice(){
  for(let i=0; i<polyVertices.length; i++){
    if(
      Math.floor(Math.sqrt( (polyVertices[i][0]-mousePosition[0])**2 +
                            (polyVertices[i][1]-mousePosition[1])**2 ))
      < 5
    ){
      return i
    }
  }
  return -1
}

function getCreateAreaType(){
  let radiogroup = document.getElementsByName("typeselect")
  for(let i=0; i<radiogroup.length; i++){
    if(radiogroup[i].checked) return radiogroup[i].value
  }
  return "unchecked"
}

function getCreatorType(){
  let radiogroup = document.getElementsByName("createselect")
  for(let i=0; i<radiogroup.length; i++){
    if(radiogroup[i].checked) return radiogroup[i].value
  }
  return "unchecked"
}

function updateMousePosition(e){
  // update mouse position variable based on position on image
  let rect = e.target.getBoundingClientRect()

  mousePosition = [
    e.clientX - rect.left,
    e.clientY - rect.top
  ]
}

function lockAreaTypes(locked){
  let radiogroup = document.getElementsByName("typeselect")
  for(let i=0; i<radiogroup.length; i++){
    radiogroup[i].disabled = locked
  }
}

function interfaceImageClick(){
  console.log("hi")

  if(select_status == "RECTSELECT"){
    select_status = ""
    imageAreas.push({
      type: "rect",
      pos: [mouseClickStorage, mousePosition]
    })
    mouseClickStorage = null;
    lockAreaTypes(false)
    return
  }  

  if(select_status == "CIRCLESELECT"){
    select_status = ""
    imageAreas.push({
      type: "circle",
      pos: mouseClickStorage,
      radius: getDistanceFromStorage()
    })
    mouseClickStorage = null;
    lockAreaTypes(false)
    return
  }  

  if(select_status == "POLYSELECT"){
    let index = closeMouseToVertice()
    console.log(index, polyStart)
    if(index == -1) return
    if(polyVertices[index] != polyPath[0]){
      polyPath.push(polyVertices[index])
    } else {
      imageAreas.push({
        type: "poly",
        path: polyPath
      })
      select_status = ""
      polyPath = []
    }
  }

  if(select_status == "VERTICECREATE"){
    polyVertices.push(mousePosition)
  }

  if(select_status == "VERTICEREMOVE"){
    let index = closeMouseToVertice()
    if(index != -1){
      polyVertices.splice(index, 1)
    }
  }

  if(getCreatorType() == "createAreas"){
    let option = getCreateAreaType();

    if(option == "rect"){
      lockAreaTypes(true)
      select_status = "RECTSELECT"
      mouseClickStorage = mousePosition
    }

    if(option == "circle"){
      lockAreaTypes(true)
      select_status = "CIRCLESELECT"
      mouseClickStorage = mousePosition
    }

    if(option == "poly"){
      lockAreaTypes(true)
      select_status = "POLYSELECT"
    }

    lockAreaTypes(false)
  }
  if(getCreatorType() == "createVertices"){
    lockAreaTypes(true)
    select_status = "VERTICECREATE"
  }
  if(getCreatorType() == "removeVertices"){
    lockAreaTypes(true)
    select_status = "VERTICEREMOVE"
  }
    lockAreaTypes(false)
}

function abortVerticeCreate(){
  select_status = "" // lol
  drawAreaIndex = -1
}

function updateMapsView(){
  const div = document.getElementById("mapsview")
  div.innerHTML = ""

  for(let i=0; i<imageAreas.length; i++){
    let div2 = document.createElement("div")
    div2.style.border = "1px solid black"

    let datapre = document.createElement("pre")
    datapre.innerHTML = `${i} ${imageAreas[i].type} ${imageAreas[i].name}`

    div2.appendChild(datapre)

    let showButton = document.createElement("button")
    showButton.innerText = "show on map"
    showButton.onclick = function(){ drawAreaIndex = i }

    let nameButton = document.createElement("button")
    nameButton.innerText = "changeName"
    nameButton.onclick = function(){ imageAreas[i].name = document.getElementById(`in${i}`).value }

    let nameInput = document.createElement("input")
    nameInput.id = `in${i}`

    div2.appendChild(showButton)
    div2.appendChild(nameButton)
    div2.appendChild(nameInput)

    div.appendChild(div2)
  }
}

function funny_export(){
  let element = document.createElement("a")

  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify({
    maps: imageAreas,
    img: document.getElementsByTagName("img")[0].src
  })))

  element.setAttribute("download", "export.sef")

  element.style.display = "none"
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}