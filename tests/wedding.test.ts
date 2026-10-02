import assert from"node:assert/strict";import test from"node:test";import{ObjectId}from"mongodb";import{createWeddingSchema,updateWeddingSchema}from"../src/modules/weddings/wedding-schemas.ts";import{buildWeddingWorkspace}from"../src/modules/weddings/wedding-factory.ts";const input={brideName:"Priya",groomName:"Rahul",weddingDate:"2027-02-14",city:"Bengaluru",state:"Karnataka",relationship:"BRIDE"as const};test("creates trusted wedding and OWNER membership",()=>{const userId=new ObjectId(),now=new Date();const built=buildWeddingWorkspace(userId,input,now),weddingId=new ObjectId(),member=built.membership(weddingId);assert.equal(built.wedding.title,"Priya & Rahul Wedding");assert.equal(built.wedding.timezone,"Asia/Kolkata");assert.ok(built.wedding.createdBy.equals(userId));assert.equal(member.role,"OWNER");assert.ok(member.userId.equals(userId));assert.ok(member.weddingId.equals(weddingId));assert.equal(member.relationship,"BRIDE")});test("strict schemas reject invalid dates and ownership mass assignment",()=>{assert.equal(createWeddingSchema.safeParse({...input,weddingDate:"invalid"}).success,false);assert.equal(createWeddingSchema.safeParse({...input,createdBy:new ObjectId().toHexString()}).success,false);assert.equal(updateWeddingSchema.safeParse({title:"Changed",createdBy:"attacker"}).success,false);assert.equal(updateWeddingSchema.safeParse({title:"Changed"}).success,true)});
test("V1 wedding setup accepts omitted location and generates the default title", () => {
  const parsed = createWeddingSchema.parse({ brideName: "Priya", groomName: "Rahul", weddingDate: "2027-02-14", relationship: "BRIDE" });
  const built = buildWeddingWorkspace(new ObjectId(), parsed, new Date());
  assert.deepEqual(built.wedding.location, { city: "", state: "" });
  assert.equal(built.wedding.title, "Priya & Rahul Wedding");
});
import { suggestWeddingTitle } from "../src/modules/weddings/wedding-title.ts";

test("suggested titles follow names and stay within validation limits", () => {
  assert.equal(suggestWeddingTitle(" Priya ", "Rahul"), "Priya & Rahul Wedding");
  assert.equal(suggestWeddingTitle("", ""), "Our Wedding");
  const title = suggestWeddingTitle("A".repeat(100), "B".repeat(100));
  assert.ok(title.length <= 150);
  assert.equal(updateWeddingSchema.safeParse({ title }).success, true);
});

test("wedding edits accept clearing optional details and reject ownership fields", () => {
  assert.deepEqual(updateWeddingSchema.parse({ city: "  ", state: "", description: "" }), { city: "", state: "", description: "" });
  assert.equal(updateWeddingSchema.safeParse({}).success, false);
  assert.equal(updateWeddingSchema.safeParse({ relationship: "BRIDE" }).success, false);
  assert.equal(updateWeddingSchema.safeParse({ weddingId: new ObjectId().toHexString(), title: "Changed" }).success, false);
});

test("create and edit reject impossible dates but accept leap days", () => {
  for (const weddingDate of ["2027-02-29", "2028-02-30", "2027-04-31"]) {
    assert.equal(createWeddingSchema.safeParse({ ...input, weddingDate }).success, false);
    assert.equal(updateWeddingSchema.safeParse({ weddingDate }).success, false);
  }
  assert.equal(updateWeddingSchema.safeParse({ weddingDate: "2028-02-29" }).success, true);
});
