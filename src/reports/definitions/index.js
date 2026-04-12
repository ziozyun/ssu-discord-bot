const { AIRCRAFT_CARRIER_DEFENSE_REPORT } = require("./aircraft-carrier-defense");
const { ARREST_REPORT } = require("./arrest");
const { HOSTAGE_RESCUE_REPORT } = require("./hostage-rescue");
const { DUTY_REPORT } = require("./duty");
const { INTERROGATION_REPORT } = require("./interrogation");
const { NEGOTIATION_REPORT } = require("./negotiation");
const { PLANE_CRASH_REPORT } = require("./plane-crash");
const { SEARCH_REPORT } = require("./search");
const { SUPPLY_REPORT } = require("./supply");
const { TRUCK_BATTLE_REPORT } = require("./truck-battle");
const { PATROL_REPORT } = require("./patrol");
const { VEHICLE_ACTIVITY_REPORT } = require("./vehicle-activity");
const { RAID_REPORT } = require("./raid");
const { PURCHASE_REPORT } = require("./purchase");
const { BUSINESS_DEFENSE_REPORT } = require("./business-defense");
const { RP_ACTIVITY_REPORT } = require("./rp-activity");
const { AGITATION_REPORT } = require("./agitation");
const { HIRING_REPORT } = require("./hiring");
const { VRU_REPORT } = require("./vru");
const { SS_CREATION_REPORT } = require("./ss-creation");
const { EXAMS_REPORT } = require("./exams");

const REPORT_DEFINITIONS = Object.freeze(
  [
    VEHICLE_ACTIVITY_REPORT,
    ARREST_REPORT,
    INTERROGATION_REPORT,
    SEARCH_REPORT,
    NEGOTIATION_REPORT,
    TRUCK_BATTLE_REPORT,
    HOSTAGE_RESCUE_REPORT,
    AIRCRAFT_CARRIER_DEFENSE_REPORT,
    SUPPLY_REPORT,
    PATROL_REPORT,
    PLANE_CRASH_REPORT,
    DUTY_REPORT,
    RAID_REPORT,
    PURCHASE_REPORT,
    BUSINESS_DEFENSE_REPORT,
    RP_ACTIVITY_REPORT,
    AGITATION_REPORT,
    HIRING_REPORT,
    VRU_REPORT,
    SS_CREATION_REPORT,
    EXAMS_REPORT,
  ]
    .filter((report) => report.channelIds.length),
);

module.exports = {
  REPORT_DEFINITIONS,
};
