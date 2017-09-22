import * as fs from "fs";
import { fileclass, wz_file } from "../parser";

export class ResourceList {
  constructor() {}

  dump() {}
  load() {}

  loadFromOrigin() {}
  loadFromList() {}

  index() {}

  private pool: any

  // content extracting

  $Map() {}
  $WorldMap() {}
  $MapElement(type: "Back"|"Obj"|"Tile", path: string) {}
  $Bgm() {}
  $SkillVoice() {}
  $Sound() {}
  $SKill() {}
  $Mob() {}
  $Item() {}
  $Effect() {}
  $CharEquip() {}
  $CharBody() {}
  $Npc() {}
  $Morph() {}
  $String() {}

  /**
   * extract from wz index straightly
   */
  $(path: string) {}

  // directories extracting
}

export default ResourceList
