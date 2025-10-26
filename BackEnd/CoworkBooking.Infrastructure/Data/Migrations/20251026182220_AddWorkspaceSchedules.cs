using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoworkBooking.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceSchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkspaceSchedulePeriods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkspaceId = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceSchedulePeriods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkspaceSchedulePeriods_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkspaceSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SchedulePeriodId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    OpenTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    CloseTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    IsWeekend = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkspaceSchedules_WorkspaceSchedulePeriods_SchedulePeriodId",
                        column: x => x.SchedulePeriodId,
                        principalTable: "WorkspaceSchedulePeriods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceSchedulePeriods_WorkspaceId",
                table: "WorkspaceSchedulePeriods",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceSchedules_SchedulePeriodId",
                table: "WorkspaceSchedules",
                column: "SchedulePeriodId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkspaceSchedules");

            migrationBuilder.DropTable(
                name: "WorkspaceSchedulePeriods");
        }
    }
}
