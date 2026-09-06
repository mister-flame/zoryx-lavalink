import { Node } from "erela.js";

export type NodeType = Node & {
    isAlive: boolean;
}