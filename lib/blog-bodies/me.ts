import type { PostBody } from "./types"

/**
 * Maine — estate angle, earned hard: 23.5% of residents are 65 or over, the
 * largest share of any state in the country.
 *
 * Vermont carries the same angle, a similar size and a similar age profile, and
 * the two previously read as near-identical. They are deliberately built on
 * different arguments here. Vermont is about being a one-time seller vetting an
 * unknown buyer. Maine is about identification: in the oldest state in America,
 * what a clear-out turns up is not one prescription's worth of supplies but a
 * decade of accumulation across several device generations, and the reader's
 * actual problem is working out what is in front of them. That framing also
 * carries the expired-exception correction structurally rather than as a
 * bolted-on paragraph, because the G6/G7 distinction is exactly the thing you
 * have to be able to make.
 *
 * All figures from lib/state-health-data.ts. No dollar amounts.
 */
export const ME: PostBody = {
  label: "Identifying what you've got",
  title: "Selling Diabetic Supplies in Maine: Working Out What You've Actually Got",
  heading: "Selling Diabetic Supplies in Maine",
  metaDescription:
    "Maine is the oldest state in the country, with 23.5% of residents 65 or over. A cupboard here holds years of accumulated supplies across several device generations — how to tell them apart and what each is worth keeping.",

  lead: [
    "23.5% of Maine residents are 65 or over — the largest share of any state in the country. That single figure explains why the question people arrive with here is usually not \"who buys this\" but \"what is all this\".",
    "A cupboard in an older Maine household is rarely one tidy prescription. It is years of accumulation: two or three generations of meter, sensors from a system that was replaced, pods from before a pump was switched, and a shelf of strips that no longer match any device in the house. Some of that is worth real money and some of it is not worth the box it came in, and the difference is not obvious from the outside.",
  ],

  sections: [
    {
      heading: "Why Maine cupboards look like this",
      paragraphs: [
        "Devices in this field are replaced far more often than the people using them change habits. A sensor system gets superseded, a pump is upgraded, a meter is switched because insurance moved to a different brand — and the old supplies stay in the cupboard because throwing away something that cost money feels wrong.",
        "Over ten or fifteen years that produces a genuine archaeology of a condition, layered by date. In the oldest state in the country this is the normal case rather than the unusual one, and it is why a Maine clear-out often produces more than the family expected.",
        "It also means the sorting is worth doing properly rather than by eye. The most valuable things in the pile are frequently not the ones that look newest.",
      ],
    },
    {
      heading: "Dexcom: G6 and G7 are not interchangeable, and it matters most when expired",
      paragraphs: [
        "This is the distinction worth learning before you touch anything else, because it is the one that decides whether a box goes in the bin or not.",
        "In date, both qualify. Dexcom G6 sensors and transmitters and Dexcom G7 sensors and receivers are all bought when sealed and unexpired. Past the date, they diverge completely: expired G7 sensors still hold value at a reduced rate, and expired G6 sensors do not qualify at all.",
        "The boxes are clearly marked with the generation, and the G7 packaging is noticeably smaller because the sensor and transmitter are a single unit rather than two pieces. If you have a pile of expired Dexcom boxes and you separate nothing else, separate these.",
        "Nearly every guide you will find says flatly that expired supplies are worthless. That advice is correct for strips and wrong here, and in a state with cupboards this deep it is wrong by a meaningful amount.",
      ],
    },
    {
      heading: "Omnipod: all three pod generations count, controllers do not",
      paragraphs: [
        "Omnipod pods qualify in all three forms — Omnipod 5, DASH and Classic — which is unusual, because most product lines lose value the moment they are superseded. Here the older generations still have a market.",
        "Pods, though, not controllers. The handheld controller or PDM that came with the system is not something we buy, so an intact boxed set is valued on the pods inside it rather than as a kit.",
        "Expired pods are the second of the two exceptions to the expiry rule, at a reduced rate rather than nothing. Between expired pods and expired G7 sensors, that is the entire list of things worth keeping past their date — everything else that has expired, including all test strips, genuinely is finished.",
      ],
    },
    {
      heading: "Matching strips to meters, and why the count on the box matters",
      paragraphs: [
        "Strips are meter-specific, and a decade of switching leaves boxes that match nothing currently in the house. That does not reduce their value — the buyer is not matching them to your relative's meter, but to someone else's.",
        "The brands that qualify are FreeStyle Lite, Contour Next in its various versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. If the name on the box is not on that list it is worth a phone call rather than an assumption.",
        "Check the count printed on each box before you decide a pile is not worth bothering with. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so two apparently similar stacks can be worth quite different amounts.",
        "FreeStyle Libre sensors carry one extra condition: US retail versions only. Anything bought outside the country cannot be resold here regardless of condition.",
      ],
    },
    {
      heading: "What disqualifies a box whatever it is",
      paragraphs: [
        "The seal, first. Factory-sealed and unopened, in original packaging. An opened box cannot be sold at any price, because nobody downstream can verify how it was handled or stored. In a deep cupboard there will be several boxes someone started and abandoned, and those are the ones to set aside immediately.",
        "Then the source. Supplies obtained through Medicare or Medicaid cannot be resold. In a state where nearly a quarter of residents are 65 or over this is worth establishing early, and the pharmacy that filled the prescriptions can usually confirm it. A pharmacy label with a name on it, by contrast, changes nothing and does not need removing.",
        "Then the date, for strips specifically: at least six months before expiry. Below that the value drops away quickly, because the next person needs time to get through the box.",
      ],
    },
    {
      heading: "Maine is unusually even, which is why nobody buys here",
      paragraphs: [
        "11.2% of Maine adults have diagnosed diabetes, slightly below the national rate of 12.1%. What is striking is how little that varies across the state: Augusta reads 13.2% and Portland 8.3%, a spread of 4.9 points, where plenty of states run to eight, ten or eleven.",
        "Lewiston at 12.9% and Auburn at 12.2% sit above the state figure, with Bangor at 11.0% and Sanford at 11.1% close to it, and South Portland, Westbrook and Saco clustered in the eights and nines.",
        "That evenness, spread across 426 ZIP codes and 1,404,172 people, is precisely why no in-person buyer operates in Maine and probably never will. In-person buying needs a dense concentration to be worth the driving, and Maine does not have one.",
      ],
    },
    {
      heading: "Posting it, once you know what you have",
      paragraphs: [
        "There is no buyer listed anywhere in Maine, so this goes by post. The label is prepaid and costs you nothing from any address in the state, including the ones where the nearest sorting office is a drive.",
        "One call with the brands, the generations and rough counts is enough to get a figure — you do not need a written inventory, and mixed lots are quoted as a single lot rather than item by item. Ten or more boxes generally earns a better per-box rate, which is often the case after a clear-out of this kind.",
        "Get the figure before the parcel leaves, photograph the sealed boxes with the dates and lot numbers visible, and keep those photographs until payment lands. Do not open a box to photograph what is inside it; opening it is what destroys the value.",
        "Payment follows within 24 hours of the parcel being received and verified, which is a real step rather than a delay — somebody checks the boxes against what was described, which is also why the description being accurate is in your interest.",
      ],
    },
  ],

  faqs: [
    {
      q: "How do I tell a Dexcom G6 box from a G7 box?",
      a: "The generation is printed on the packaging, and G7 boxes are noticeably smaller because the sensor and transmitter are one unit. It matters because expired G7 sensors still hold value at a reduced rate while expired G6 sensors do not qualify at all.",
    },
    {
      q: "The meter these strips belong to was discontinued years ago. Are they worthless?",
      a: "Not necessarily. Strips are valued on brand, count and expiry date rather than on whether the matching meter is still in the house. If the brand is on the list and the box is sealed with six months or more left, it counts.",
    },
    {
      q: "I found pods and the controller they came with. Is the whole set worth something?",
      a: "The pods are. Controllers and PDMs are not something we buy, so a boxed set is valued on the pods inside it. Omnipod 5, DASH and Classic pods all qualify, and expired pods still carry a reduced rate.",
    },
    {
      q: "Half the boxes have been opened. Is there anything to do with those?",
      a: "They cannot be sold — an opened box is finished for resale purposes at any price. Lancets, needles and anything sharp should go to a pharmacy take-back or a household hazardous waste collection point rather than into normal rubbish.",
    },
    {
      q: "Is there anyone in Portland or Bangor who buys in person?",
      a: "No. There is no listed buyer anywhere in Maine, and given how evenly the state's population is spread that is unlikely to change. Mail-in with a prepaid label is the honest answer and costs you nothing.",
    },
    {
      q: "There is a great deal of it, going back years. Does that complicate things?",
      a: "It improves things. Large lots are quoted as a whole, mixed brands and generations do not need separating, and ten or more boxes generally earns a better per-box rate than the same boxes sold piecemeal.",
    },
  ],
}
