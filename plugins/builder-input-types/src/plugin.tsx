import { Builder } from "@builder.io/react";
import pkg from "../package.json";
import { NumberSlider } from "./components/NumberSlider";
import CMSLink from "./components/CMSLink";

const pluginId = pkg.name;

Builder.registerEditor({
  name: "numberSlider",
  component: NumberSlider,
});

Builder.registerEditor({
  name: "CMSLink",
  component: CMSLink,
});
