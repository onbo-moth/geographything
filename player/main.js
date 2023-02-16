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
  }
})


var imageAreas;

function createImg(file){
  let reader = new FileReader();

  reader.onload = function(e){
    let res = JSON.parse(e.target.result)

    imageAreas = res.maps

    let image = document.createElement("img")
    image.src = res.img
    image.id  = "image"

    image.addEventListener("load", function(){
      createCanvasOnImage()
    })

    document.getElementById("imgviewer").appendChild(image)
  }

  reader.readAsText(file)
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

  shuffleGame()
  newGame()

  const FPS = 1000 / 60  // 60fps
  let interval = setInterval(function(){
    // Canvas LOOP
    CTX.clearRect(0, 0, canvas.width, canvas.height)

    for(let i=0; i<imageAreas.length; i++){
      if(imageAreas[i].type == "poly"){
        if(pointInPolygon(imageAreas[i].path)){
          drawPolygon(CTX, i)
        }
      }
    }

  }, FPS)
}

function updateMousePosition(e){
  // update mouse position variable based on position on image
  let rect = e.target.getBoundingClientRect()

  mousePosition = [
    e.clientX - rect.left,
    e.clientY - rect.top
  ]
}

var mousePosition = []

var gameArray = []
var gameIndex = 0
var gameFails = 0

var score = 0;
var tries = 0;


function newGame(){
  shuffleGame()
  gameIndex = 0
  gameFails = 0
  score = 0
  tries = 0

  writeScore()
  writeChoose()
}

function shuffleGame(){
  for(let i=0; i<imageAreas.length; i++){
    gameArray[i] = i
  }

  gameArray.sort(function(a, b){ return 0.5 - Math.random()})
}

function writeChoose(){
  document.getElementById("choose").innerHTML = `wybierz: ${imageAreas[gameArray[gameIndex]].name}`
}

function writeScore(){
  document.getElementById("score").innerHTML = `${score}/${tries} = ${Math.round(score/tries * 100)}%`
}

function interfaceImageClick() {
  if(gameIndex > gameArray.length) return

  let polygon = null
  for(let i=0; i<imageAreas.length; i++){
    if(imageAreas[i].type == "poly"){
      if(pointInPolygon(imageAreas[i].path)){
        polygon = i
      }
    }
  }

  if(polygon == null) return

  if(polygon == gameArray[gameIndex]){
    score++
    gameIndex++
    gameFails = 0
  } else {
    gameFails++
  }

  if(gameFails = 3){
    gameFails = 0
    gameIndex++
  }

  tries++

  writeScore()
  writeChoose()
}

function l2lCollision(x1, y1, x2, y2, x3, y3, x4, y4){
  // dont ask
  let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))
  let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return true
  }
  return false
}

function pointInPolygon(polygon){
  // 4 lines horizontally and vertically spreading from mouse
  // check if each line has collision with any of polygon lines

  let lines_collided = [false, false, false, false] // clockwise from up
  for(i=0; i<polygon.length; i++){
    if(!lines_collided[0]) lines_collided[0] = l2lCollision(
      mousePosition[0], mousePosition[1],
      mousePosition[0], mousePosition[1] - 1000,
      polygon[i][0], polygon[i][1],
      polygon[(i+1) % polygon.length][0], polygon[(i+1) % polygon.length][1]
    )
    if(!lines_collided[1]) lines_collided[1] = l2lCollision(
      mousePosition[0], mousePosition[1],
      mousePosition[0] + 1000, mousePosition[1],
      polygon[i][0], polygon[i][1],
      polygon[(i+1) % polygon.length][0], polygon[(i+1) % polygon.length][1]
    )
    if(!lines_collided[2]) lines_collided[2] = l2lCollision(
      mousePosition[0], mousePosition[1],
      mousePosition[0], mousePosition[1] + 1000,
      polygon[i][0], polygon[i][1],
      polygon[(i+1) % polygon.length][0], polygon[(i+1) % polygon.length][1]
    )
    if(!lines_collided[3]) lines_collided[3] = l2lCollision(
      mousePosition[0], mousePosition[1],
      mousePosition[0] - 1000, mousePosition[1],
      polygon[i][0], polygon[i][1],
      polygon[(i+1) % polygon.length][0], polygon[(i+1) % polygon.length][1]
    )
  }
  return lines_collided.every(el => el === true)
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
  for(let i=0; i<imageAreas[index].path.length+1; i++){
    ctx.strokeStyle = "#000000"
    ctx.fillStyle = "#88ff8888"
    ctx.lineTo(imageAreas[index].path[i%imageAreas[index].path.length][0], imageAreas[index].path[i%imageAreas[index].path.length][1])
  }
  ctx.fill()
  ctx.stroke();
  ctx.closePath()
}

