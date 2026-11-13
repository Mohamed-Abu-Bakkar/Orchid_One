import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {id:"/",name:"Orchid One – HR Management",short_name:"Orchid One",description:"Orchid Flowers workforce management",start_url:"/",scope:"/",display:"standalone",background_color:"#faf8fa",theme_color:"#5a285f",icons:[{src:"/assets/android/launchericon-192x192.png",sizes:"192x192",type:"image/png"},{src:"/assets/android/launchericon-512x512.png",sizes:"512x512",type:"image/png"}]};
}
