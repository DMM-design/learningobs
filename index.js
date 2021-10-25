import ObsWebSocket from "obs-websocket-js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {Server} from "socket.io";
import { createServer } from "http";

export default class App{

    obs;
   constructor()
    {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.port = 3000;
        this.obs =  new ObsWebSocket();
        this.io = new Server(this.httpServer, {
            cors: {
              origin: ["http://192.168.110.116:3000/", "http://localhost:3000"],
              methods: ["GET", "POST"]
            }
          });
        this.config();
        this.Handlers();
        this.routes();
    }

    async config()
    {
        this.app.set('port', process.env.PORT || 3000);
        this.app.use(express.json());
        this.app.use(cors({
            origin: ["http://192.168.110.116:3000/", "http://localhost:3000"],
            optionsSuccessStatus: 200 
          }));
        this.app.use(helmet());
        this.app.use(express.urlencoded({ extended: false }));
        
    }

    routes()
    {
        this.app.get('/', async (req, res) => {res.json("Hello World")});
    }

    async Handlers()
    {
        await this.obs.connect({address: 'localhost:4444', password: '1234'})
            .then(() => console.log('Connected to OBS'))
            .catch((err) => console.log(err.error));
            const Scene = await this.obs.send("GetSceneList");
            for(const scene of Scene.scenes)
            {
                for(const item of scene.sources)
                {
                    let start = 0;
                    switch(item.name)
                    {
                        case "Ekran":
                            //@ts-ignore
                            await setInterval(() => {
                                const countPosition = 50 * Math.sin( start );
                                const rotation = Math.sin( start );
                                this.obs.send("SetSceneItemProperties", {
                                    "scene-name": scene.name, 
                                    item: {name: item.name},
                                    position: {y: countPosition + 150, x: 550},
                                    rotation: rotation,
                                    scale: {x: .650, y: .700}
                                });
                                start += 0.05;
                            }, 1000/30 )
                            break;
                        case "Kamerka":
                            await setInterval(() => {
                                const countPosition = 50 * Math.sin( start );
                                let rotation = 0;
                                this.obs.send("SetSceneItemProperties", {
                                    "scene-name": scene.name, 
                                    item: {name: item.name},
                                    position: {y: countPosition + 200, x: 150},
                                    rotation: 25 * Math.sin(start),
                                    scale: {x: .650, y: .700}
                                });
                                start += 0.05;
                            }, 1000/30 )
                            break;
                    }
                }
            }
    }

    emitSocket(eventName, eventData)
    {
        this.io.emit(eventName, eventData);
    }

    start()
    {
       const serv =  this.httpServer.listen(this.port);
       serv.on('listening',() => {
           console.log("Hello World");
       })
       return serv;
    }
}
const main = new App();