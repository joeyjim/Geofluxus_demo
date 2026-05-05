An important part of the geoFluxus platform is the map view: an interactive map on which waste streams are visualized.

User behavior shows that users click on streams on the map; however, this currently offers no additional information. The current interaction displays a small tooltip with only four data fields: EWC code, origin, destination, and weight. This causes frustration: anyone wanting more information about a stream must navigate to another page. Additionally, users sometimes do not know where to start when they see the map and look aimlessly at multiple streams on the map.

There are therefore two challenges:

Orientation on the map: Users do not know where to begin. The map displays dozens of streams at once but provides little guidance to determine which stream is worth investigating further.

Deeper waste stream information: Users seek more information behind the first tooltip. How do we answer the questions: Where does the waste come from? Who processes it? What is in it? How far has it been transported? How has it been processed? On what data is this stream based?

As a starting point, you have the files here on the right;

The current map view

Our new design for the first challenge mentioned above (orientation on the map)

An empty map document  
2 other modules from our platform: ‘Processing’, where details are visible per waste stream, and ‘Dataset’, where all data points and source files are visible per waste stream.

Design  
Your assignment is to design the next step in the new map: what happens when someone actually clicks on a stream? What does the platform show to the user when they click on a stream? There is a lot of information available per waste stream (you can retrieve this from the other shared screens). Which information is valuable to show first? How do you present the information in a digestible way, without omitting relevant context?

More context on question:  
The color coding in the legend is indeed linked to the map. (In the design, this may deviate slightly because the map is currently a screenshot, whereas the right panel is based on fictitious data.)

We focus partly on the largest flows (based on weight) because these have the greatest influence on overall performance. If a heavy waste stream is processed poorly, this has a major impact on, for example, the total recycling rate.  
Additionally, we highlight the longest stream to identify whether waste is being transported unnecessarily far. If a factory in Zeeland sends its waste to Groningen while a processor is located closer by, this is worth considering. There is a nuance, however: if it concerns a special type of waste that can only be processed properly in Groningen, the transport may be worthwhile. But generally speaking, transport distance is a good starting point to assess whether waste is already being managed well.

The processing page is separate from the view visible in the 'Map' — it is a separate module. Here, waste is grouped by Euralcode (visible as a material type), whereby multiple shipments are combined. For example, if you have five factory locations in the Netherlands that all produce cement as waste, these are combined in the processing module to see how this material is processed in total. If you only want to see information from just one location in 'Processing', this is of course possible by applying a filter.

In 'Map', shipments are kept separate and are not combined from multiple locations: there, one line always represents one specific waste stream from point A to point B.

(The Processing page was specifically added to the file to show what information fields we have available per waste stream.)  
