using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoworkBooking.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workspaces_AspNetUsers_OwnerId1",
                table: "Workspaces");

            migrationBuilder.DropIndex(
                name: "IX_Workspaces_OwnerId1",
                table: "Workspaces");

            migrationBuilder.DropColumn(
                name: "OwnerId1",
                table: "Workspaces");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId1",
                table: "Workspaces",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Workspaces_OwnerId1",
                table: "Workspaces",
                column: "OwnerId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Workspaces_AspNetUsers_OwnerId1",
                table: "Workspaces",
                column: "OwnerId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
